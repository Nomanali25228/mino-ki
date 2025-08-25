import Product from '../models/product.model.js';
import cloudinary from '../lib/cloudinary.js';

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, discountedPrice, quantity, category } = req.body;
    let imageUrl = image;
    if (image && image.startsWith('data:')) {
      // If image is base64, upload to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, { folder: 'products' });
      imageUrl = uploadResponse.secure_url;
    }
    const product = new Product({
      name,
      price,
      description,
      image: imageUrl,
      discountedPrice,
      quantity,
      category
    });
    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message || error });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { image } = req.body;
    let updateData = { ...req.body };
    if (image && image.startsWith('data:')) {
      // If image is base64, upload to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, { folder: 'products' });
      updateData.image = uploadResponse.secure_url;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
};