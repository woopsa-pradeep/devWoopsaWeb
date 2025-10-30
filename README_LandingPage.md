# Woopsa Landing Page

## Overview
A modern, responsive landing page for Woopsa wholesale business with **premium product carousels**, advertisement banners, and integrated CustomButton components.

## Recent Updates & Fixes ✅

### 🎨 **Premium UI Design (Latest)**
- **Beautiful Carousel Backgrounds**: Gradient backgrounds with subtle pattern overlays
- **Enhanced Product Cards**: Glass-morphism design with premium shadows and borders
- **Advanced Hover Effects**: Smooth animations with scale, lift, and image zoom
- **Professional Typography**: Enhanced fonts, weights, and text shadows
- **Premium Color Scheme**: Modern gradients and sophisticated color palettes

### 🎯 **Product Carousel Improvements**
- **Fixed Image Display**: All product images now properly imported and displayed
- **Added Product Spacing**: Proper gaps between product cards for better visual separation
- **Removed Price Display**: Clean product cards without price information
- **Added Action Buttons**: Each product now has a "View Details" button
- **Login Redirect**: All product buttons redirect to login page
- **Enhanced Styling**: Better borders, shadows, and hover effects

### 🔧 **Technical Fixes**
- **Image Import System**: Direct imports for all product images (product1.png through product7.png)
- **Proper Spacing**: CSS gap property for consistent card spacing
- **Button Integration**: CustomButton component properly integrated in each product card
- **Event Handling**: onProductClick prop for consistent behavior across all carousels

## Features

### 🎯 Branding
- **Company Name**: Woopsa (updated from AtoZ Wholesale)
- **Logo**: Uses Vector.svg and Woopsa White.svg assets
- **Color Theme**: Consistent with #3C7795 primary color scheme

### 🎠 **Premium Product Carousels**
- **New Arrivals**: Latest products with fast scrolling (25s speed)
- **Popular Items**: Best-selling products (30s speed)
- **Special Offers**: Discounted items with animated discount badges (35s speed)
- **Featured Products**: Handpicked promotional items (40s speed)

### 🎨 **Enhanced Visual Design**
- **Gradient Backgrounds**: Beautiful purple-blue gradients for each carousel
- **Glass-morphism Cards**: Premium product cards with backdrop blur effects
- **Advanced Animations**: Smooth hover effects with scale, lift, and image zoom
- **Professional Shadows**: Multi-layered shadows for depth and dimension
- **Animated Elements**: Floating discount badges and smooth transitions

### 📢 Advertisement Banners
- **Top Banner**: Special wholesale deals (Green theme)
- **Middle Banner**: Fast delivery information (Orange theme)
- **Bottom Banner**: Quality guarantee (Purple theme)

### 🔘 CustomButton Integration
- All buttons replaced with CustomButton component
- Consistent styling and behavior
- Proper button types and appearances
- Responsive sizing

### 📱 Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

## Components

### **ProductCarousel (Premium Edition)**
- **Infinite scroll animation** with smooth transitions
- **Premium product cards** with glass-morphism design
- **Advanced hover effects** with scale, lift, and image zoom
- **Gradient backgrounds** with subtle pattern overlays
- **Animated discount badges** with floating effects
- **Professional shadows** and borders
- **Image overlay effects** on hover
- **Proper spacing** between product cards
- **Image import system** for reliable image display

### AdvertisementBanner
- Gradient backgrounds with pattern overlays
- Responsive text sizing
- Optional decorative images
- Customizable colors and themes

### CustomButton
- Material-UI based button system
- Multiple button types (primary, cancel, delete)
- Appearance options (filled, outlined)
- Size variants (small, medium, large)

## File Structure
```
src/
├── pages/
│   ├── LandingPage.tsx          # Main landing page component
│   └── LandingPage.css          # Landing page styles (Enhanced)
├── component/atoms/
│   ├── ProductCarousel.tsx      # Premium product carousel component
│   ├── AdvertisementBanner.tsx  # Advertisement banner component
│   └── CustomButton.tsx         # Custom button component
└── assets/
    ├── Vector.svg               # Woopsa logo (colored)
    ├── Woopsa White.svg        # Woopsa logo (white)
    ├── product1.png            # Product images
    ├── product2.png            # Product images
    ├── product3.png            # Product images
    ├── product4.png            # Product images
    ├── product5.jpg            # Product images
    ├── product6.png            # Product images
    └── product7.png            # Product images
```

## Usage

### Running the Application
```bash
npm start
```

### Building for Production
```bash
npm run build
```

## Dependencies
- React 19.1.0
- Material-UI 7.0.2
- Emotion (for styling)
- TypeScript 4.9.5

## Customization

### Colors
- Primary: #3C7795
- Secondary: #2c5a6f
- Carousel Backgrounds: Purple-blue gradients
- Accent colors for banners

### Carousel Speeds
- Adjust speed prop in ProductCarousel components
- Lower numbers = faster scrolling
- Higher numbers = slower scrolling

### Product Cards
- **Spacing**: Controlled by CSS gap property
- **Styling**: Glass-morphism design with premium shadows
- **Buttons**: Customizable button text and behavior
- **Images**: Direct import system for reliable display
- **Hover Effects**: Scale, lift, and image zoom animations

### Advertisement Content
- Modify banner titles, subtitles, and colors
- Add or remove banners as needed
- Customize background patterns and gradients

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance
- **Optimized carousel animations** with CSS keyframes
- **Efficient image loading** with direct imports
- **Smooth transitions** and hover effects
- **Responsive design** for all device sizes
- **Hardware acceleration** for animations

## Troubleshooting

### Image Display Issues
- Ensure all product images are in the `src/assets/` directory
- Verify image file names match the import statements
- Check that image files are valid PNG/JPG formats

### Spacing Issues
- CSS gap property controls spacing between product cards
- Adjust gap value in ProductCarousel component if needed
- Ensure proper container padding for overall layout

### Button Functionality
- All product buttons redirect to login page
- Verify CustomButton component is properly imported
- Check that onProductClick prop is passed correctly

### UI Rendering Issues
- Ensure CSS animations are supported by the browser
- Check that backdrop-filter is supported for glass-morphism effects
- Verify that all CSS properties are properly applied

## Design Features

### 🎨 **Visual Enhancements**
- **Glass-morphism Design**: Modern backdrop blur effects
- **Gradient Backgrounds**: Beautiful color transitions
- **Premium Shadows**: Multi-layered depth effects
- **Smooth Animations**: CSS transitions and keyframes
- **Professional Typography**: Enhanced font weights and spacing

### 🚀 **Interactive Elements**
- **Hover Effects**: Scale, lift, and image zoom
- **Image Overlays**: Click-to-view overlays on hover
- **Animated Badges**: Floating discount indicators
- **Smooth Transitions**: Professional animation timing
- **Responsive Interactions**: Touch-friendly mobile experience
