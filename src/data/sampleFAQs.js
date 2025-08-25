// Sample FAQ data for testing
// You can use this data to manually create FAQs through the admin panel or create a seeder script

const sampleFAQs = [
  {
    title: "How do I start selling on your platform?",
    description: `To start selling on our platform, follow these simple steps:

1. Create a seller account by clicking 'Sign Up' and selecting 'Seller'
2. Complete your profile information including shop name and contact details
3. Verify your email address and phone number
4. Add your first product with detailed descriptions and high-quality images
5. Set up your payment methods for receiving payments
6. Start selling and manage your orders through the seller dashboard

Our team will review your account and products to ensure they meet our quality standards.`,
    order: 1
  },
  {
    title: "How do I add products to my shop?",
    description: `Adding products is easy through your seller dashboard:

1. Navigate to 'Manage Products' in your seller dashboard
2. Click 'Add New Product'
3. Fill in all required product details:
   - Product name and description
   - Category and subcategory
   - Price and stock quantity
   - Product images (at least 3 high-quality photos)
   - Shipping information
4. Review your product information
5. Click 'Save' to publish your product

Tips for better sales:
- Use clear, high-resolution images
- Write detailed product descriptions
- Set competitive prices
- Keep your inventory updated`,
    order: 2
  },
  {
    title: "How do I manage my orders?",
    description: `Order management is streamlined through your dashboard:

1. Go to 'Orders' section in your seller dashboard
2. View all orders with their current status
3. Update order status as you process them:
   - Pending: New orders waiting for your confirmation
   - Confirmed: Orders you've accepted
   - Shipped: Orders that have been dispatched
   - Delivered: Completed orders
   - Cancelled: Declined or cancelled orders

You'll receive email notifications for new orders and can communicate with customers through our messaging system.`,
    order: 3
  },
  {
    title: "When and how do I get paid?",
    description: `Our payment system ensures you get paid promptly:

Payment Schedule:
- Payments are processed weekly every Friday
- Minimum payout threshold is $50
- Funds are typically available 2-3 business days after processing

Payment Methods:
- Bank transfer (most common)
- PayPal
- Mobile money (where available)

To set up payments:
1. Go to 'Money Withdraw' in your dashboard
2. Add your preferred payment method
3. Verify your account details
4. Your earnings will be automatically paid out when they reach the threshold

Commission: We charge a 5% commission on each sale to maintain the platform.`,
    order: 4
  },
  {
    title: "What are the product guidelines and restrictions?",
    description: `To maintain quality and legal compliance, please follow these guidelines:

Allowed Products:
- Electronics and accessories
- Fashion and clothing
- Home and garden items
- Books and media
- Health and beauty products
- Sports and fitness equipment

Prohibited Items:
- Illegal or regulated substances
- Counterfeit or copyright-infringing products
- Weapons or dangerous items
- Adult content
- Live animals
- Medical devices requiring prescriptions

Quality Standards:
- Products must be new unless clearly marked as used
- Accurate descriptions and genuine photos required
- All items must comply with local laws and regulations
- Proper packaging and handling required

Violation of these guidelines may result in product removal or account suspension.`,
    order: 5
  },
  {
    title: "How do I contact customer support?",
    description: `We're here to help! You can reach our support team through several channels:

1. Live Chat: Click 'Contact Support' in your seller dashboard
2. Email: support@yourplatform.com
3. Phone: +1-800-SUPPORT (Mon-Fri, 9AM-6PM)
4. Help Center: Browse our comprehensive help articles

Response Times:
- Live chat: Typically within 5 minutes during business hours
- Email: Within 24 hours
- Phone: Immediate assistance during business hours

For urgent issues like payment problems or account security, use live chat or phone support for fastest response.

Common issues we can help with:
- Account setup and verification
- Product listing problems
- Order disputes
- Payment and withdrawal issues
- Technical difficulties
- Policy clarifications`,
    order: 6
  },
  {
    title: "How do I optimize my product listings for better visibility?",
    description: `Boost your sales with these optimization tips:

SEO Best Practices:
- Use relevant keywords in your product title
- Write detailed, keyword-rich descriptions
- Choose the most specific category for your product
- Add relevant tags and attributes

Image Guidelines:
- Use high-resolution images (at least 1000x1000 pixels)
- Show multiple angles of your product
- Include lifestyle photos showing the product in use
- Ensure good lighting and clean backgrounds

Pricing Strategy:
- Research competitor prices
- Consider offering bundle deals
- Use promotional pricing strategically
- Keep prices updated based on market trends

Inventory Management:
- Keep stock levels updated
- Remove out-of-stock items promptly
- Plan for seasonal demand
- Use our low-stock alerts

Customer Engagement:
- Respond promptly to customer questions
- Maintain high seller ratings
- Offer excellent customer service
- Handle returns and exchanges professionally`,
    order: 7
  }
];

export default sampleFAQs;
