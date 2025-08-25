import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import SellerProduct from '../models/sellerProduct.model.js';
import mongoose from 'mongoose';

// Create new order (Admin only)
export const createOrder = async (req, res) => {
  try {
    const { sellerId, items, notes } = req.body;
    const createdBy = req.user._id;

    console.log('Creating order:', { 
      sellerId, 
      itemsCount: items?.length, 
      notes,
      createdBy,
      userRole: req.user.role 
    });

    // Validate admin role
    if (req.user.role !== 'admin') {
      console.log('Access denied: User is not admin');
      return res.status(403).json({ message: 'Only admins can create orders' });
    }

    // Validate required fields
    if (!sellerId || !items || !Array.isArray(items) || items.length === 0) {
      console.log('Validation failed:', { sellerId, itemsArray: Array.isArray(items), itemsLength: items?.length });
      return res.status(400).json({ message: 'Seller ID and at least one item are required' });
    }

    // Validate seller exists and is approved
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller' || !seller.approved) {
      console.log('Seller validation failed:', { 
        sellerExists: !!seller, 
        sellerRole: seller?.role, 
        sellerApproved: seller?.approved 
      });
      return res.status(400).json({ message: 'Invalid or unapproved seller' });
    }

    console.log('Seller validated:', { sellerId: seller._id, sellerName: seller.name });

    // Validate and process items
    const processedItems = [];
    let totalAmount = 0;
    let totalProfit = 0;

    console.log('Processing items:', items);

    for (const item of items) {
      console.log('Processing item:', item);
      
      // Find the seller product instead of just the product
      const sellerProduct = await SellerProduct.findById(item.productId).populate('product');
      if (!sellerProduct) {
        console.log('Seller product not found:', item.productId);
        return res.status(400).json({ message: `Seller product ${item.productId} not found` });
      }

      // Validate that this seller product belongs to the selected seller
      if (sellerProduct.seller.toString() !== sellerId.toString()) {
        console.log('Seller product does not belong to selected seller:', {
          sellerProductSeller: sellerProduct.seller.toString(),
          selectedSeller: sellerId.toString()
        });
        return res.status(400).json({ message: `Product does not belong to selected seller` });
      }

      // Check if seller has enough quantity
      if (sellerProduct.sellerQuantity < item.quantity) {
        console.log('Insufficient quantity:', {
          available: sellerProduct.sellerQuantity,
          requested: item.quantity
        });
        return res.status(400).json({ 
          message: `Insufficient quantity for ${sellerProduct.product.name}. Available: ${sellerProduct.sellerQuantity}, Requested: ${item.quantity}` 
        });
      }

      console.log('Seller product found:', { 
        id: sellerProduct._id, 
        productName: sellerProduct.product.name, 
        sellerPrice: sellerProduct.sellerPrice, 
        sellerDiscountedPrice: sellerProduct.sellerDiscountedPrice,
        sellerQuantity: sellerProduct.sellerQuantity
      });

      const quantity = item.quantity || 1;
      const originalPrice = sellerProduct.sellerPrice;
      const discountedPrice = sellerProduct.sellerDiscountedPrice || sellerProduct.sellerPrice;
      const itemTotal = discountedPrice * quantity;
      const itemProfit = (originalPrice - discountedPrice) * quantity;

      console.log('Item calculations:', {
        quantity,
        originalPrice,
        discountedPrice,
        itemTotal,
        itemProfit
      });

      processedItems.push({
        product: sellerProduct.product._id,
        quantity,
        originalPrice,
        discountedPrice,
        totalPrice: itemTotal,
        profit: itemProfit
      });

      totalAmount += itemTotal;
      totalProfit += itemProfit;

      // Update seller product quantity
      sellerProduct.sellerQuantity -= quantity;
      await sellerProduct.save();
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    console.log('Generated order number:', orderNumber);

    // Create order
    const order = new Order({
      orderNumber,
      seller: sellerId,
      createdBy,
      items: processedItems,
      totalAmount,
      totalProfit,
      notes: notes || ''
    });

    console.log('Order data before save:', {
      orderNumber: order.orderNumber,
      seller: order.seller,
      itemsCount: order.items.length,
      totalAmount: order.totalAmount,
      totalProfit: order.totalProfit
    });

    await order.save();

    // Populate order for response
    await order.populate([
      { path: 'seller', select: 'name email shopName creditAmount pendingAmount' },
      { path: 'createdBy', select: 'name email' },
      { path: 'items.product', select: 'name image price discountedPrice' }
    ]);

    console.log('Order created successfully:', order.orderNumber);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get all orders (Admin) or seller's orders (Seller)
export const getOrders = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'seller') {
      query.seller = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const orders = await Order.find(query)
      .populate('seller', 'name email shopName creditAmount pendingAmount')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name image price discountedPrice')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = { _id: id };
    if (req.user.role === 'seller') {
      query.seller = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('seller', 'name email shopName creditAmount pendingAmount')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name image price discountedPrice');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`Updating order ${id} status to: ${status}`);

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update order status' });
    }

    const validStatuses = ['pending', 'processing', 'picked', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id).populate('seller');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Handle status-specific logic
    if (status === 'delivered' && oldStatus !== 'delivered') {
      order.deliveredAt = new Date();
      
      // Move amount from pendingAmount to creditAmount and add profit
      const seller = order.seller;
      seller.pendingAmount = Math.max(0, seller.pendingAmount - order.totalAmount);
      // Add both order amount and profit to credit amount
      seller.creditAmount += (order.totalAmount + order.totalProfit);
      seller.totalOrders = (seller.totalOrders || 0) + 1;
      await seller.save();

      console.log(`Order delivered - Updated seller balance: creditAmount=${seller.creditAmount}, pendingAmount=${seller.pendingAmount}`);
    }

    await order.save();

    // Repopulate for response
    await order.populate([
      { path: 'seller', select: 'name email shopName creditAmount pendingAmount' },
      { path: 'createdBy', select: 'name email' },
      { path: 'items.product', select: 'name image price discountedPrice' }
    ]);

    res.status(200).json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Seller response to order (Accept/Reject)
export const sellerOrderResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, rejectionReason } = req.body;

    console.log(`Seller responding to order ${id}: ${response}`, {
      sellerId: req.user._id,
      response,
      rejectionReason,
      userRole: req.user.role
    });

    if (req.user.role !== 'seller') {
      console.log('Access denied: User is not seller');
      return res.status(403).json({ message: 'Only sellers can respond to orders' });
    }

    const validResponses = ['accepted', 'rejected'];
    if (!validResponses.includes(response)) {
      console.log('Invalid response provided:', response);
      return res.status(400).json({ message: 'Invalid response' });
    }

    const order = await Order.findOne({ 
      _id: id, 
      seller: req.user._id 
    }).populate('seller');

    if (!order) {
      console.log('Order not found or not belonging to seller:', { orderId: id, sellerId: req.user._id });
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order found:', {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      currentResponse: order.sellerResponse,
      totalAmount: order.totalAmount
    });

    if (order.sellerResponse !== 'pending') {
      console.log('Order already responded to:', order.sellerResponse);
      return res.status(400).json({ message: 'Order has already been responded to' });
    }

    // Check credit balance for acceptance
    if (response === 'accepted') {
      const seller = order.seller;
      console.log('Checking seller balance:', {
        sellerId: seller._id,
        creditAmount: seller.creditAmount,
        orderAmount: order.totalAmount,
        hasEnoughBalance: seller.creditAmount >= order.totalAmount
      });
      
      if (seller.creditAmount < order.totalAmount) {
        console.log('Insufficient balance - rejecting order acceptance');
        return res.status(400).json({ 
          message: 'Insufficient balance. Please recharge your account.',
          required: order.totalAmount,
          available: seller.creditAmount
        });
      }

      // Update seller amounts - deduct from credit and add to pending
      const oldCreditAmount = seller.creditAmount;
      const oldPendingAmount = seller.pendingAmount || 0;
      
      seller.creditAmount -= order.totalAmount;
      seller.pendingAmount = oldPendingAmount + order.totalAmount;
      
      console.log('Updating seller balance:', {
        oldCreditAmount,
        newCreditAmount: seller.creditAmount,
        oldPendingAmount,
        newPendingAmount: seller.pendingAmount
      });
      
      await seller.save();

      order.status = 'processing';
      order.acceptedAt = new Date();

      console.log(`Order accepted - Updated seller balance: creditAmount=${seller.creditAmount}, pendingAmount=${seller.pendingAmount}`);
    } else {
      order.rejectionReason = rejectionReason || '';
      console.log(`Order rejected with reason: ${rejectionReason}`);
    }

    order.sellerResponse = response;
    await order.save();

    console.log('Order response saved:', {
      orderNumber: order.orderNumber,
      newStatus: order.status,
      newResponse: order.sellerResponse
    });

    // Repopulate for response
    await order.populate([
      { path: 'seller', select: 'name email shopName creditAmount pendingAmount' },
      { path: 'createdBy', select: 'name email' },
      { path: 'items.product', select: 'name image price discountedPrice' }
    ]);

    console.log('Sending successful response for order:', order.orderNumber);

    res.status(200).json({
      message: `Order ${response} successfully`,
      order
    });

  } catch (error) {
    console.error('Error responding to order:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update order (Admin only)
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId, items, notes } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update orders' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.sellerResponse === 'accepted') {
      return res.status(400).json({ message: 'Cannot update accepted orders' });
    }

    // Validate seller if changed
    if (sellerId && sellerId !== order.seller.toString()) {
      const seller = await User.findById(sellerId);
      if (!seller || seller.role !== 'seller' || !seller.approved) {
        return res.status(400).json({ message: 'Invalid or unapproved seller' });
      }
      order.seller = sellerId;
    }

    // Update items if provided
    if (items && items.length > 0) {
      const processedItems = [];
      
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }

        const quantity = item.quantity || 1;
        const originalPrice = product.price; // Use 'price' as originalPrice
        const discountedPrice = product.discountedPrice || product.price; // Use price as fallback
        const itemTotal = discountedPrice * quantity;
        const itemProfit = (originalPrice - discountedPrice) * quantity;

        processedItems.push({
          product: product._id,
          quantity,
          originalPrice,
          discountedPrice,
          totalPrice: itemTotal,
          profit: itemProfit
        });
      }

      order.items = processedItems;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    await order.populate([
      { path: 'seller', select: 'name email shopName creditAmount pendingAmount' },
      { path: 'createdBy', select: 'name email' },
      { path: 'items.product', select: 'name image price discountedPrice' }
    ]);

    res.status(200).json({
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete order (Admin only)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete orders' });
    }

    const order = await Order.findById(id).populate('seller');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.sellerResponse === 'accepted') {
      // Refund the seller if order was accepted
      const seller = order.seller;
      seller.creditAmount += order.totalAmount;
      seller.pendingAmount = Math.max(0, seller.pendingAmount - order.totalAmount);
      await seller.save();

      console.log(`Order deleted - Refunded seller: creditAmount=${seller.creditAmount}, pendingAmount=${seller.pendingAmount}`);
    }

    await Order.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get order statistics for seller dashboard
export const getOrderStats = async (req, res) => {
  try {
    const sellerId = req.user.role === 'seller' ? req.user._id : req.params.sellerId;
    
    // For sellers, they can only access their own stats
    // For admins, they can access any seller's stats
    if (req.user.role === 'seller' && sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get user's financial information
    const user = await User.findById(sellerId).select('creditAmount pendingAmount');
    if (!user) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get order statistics
    const stats = await Order.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$sellerResponse', 'pending'] }, 1, 0] }
          },
          acceptedOrders: {
            $sum: { $cond: [{ $eq: ['$sellerResponse', 'accepted'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          // Calculate pending amount from orders that are accepted but not delivered
          pendingOrderAmount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$sellerResponse', 'accepted'] },
                    { $ne: ['$status', 'delivered'] }
                  ]
                },
                '$totalAmount',
                0
              ]
            }
          },
          // Calculate available amount from delivered orders
          availableAmount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    const orderStats = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalProfit: 0,
      pendingOrders: 0,
      acceptedOrders: 0,
      deliveredOrders: 0,
      pendingOrderAmount: 0,
      availableAmount: 0
    };

    // Combine user financial data with order statistics
    const result = {
      ...orderStats,
      creditAmount: user.creditAmount || 0,
      pendingAmount: user.pendingAmount || 0,
      availableBalance: orderStats.availableAmount - (user.pendingAmount || 0),
      totalProfit: orderStats.totalProfit
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
