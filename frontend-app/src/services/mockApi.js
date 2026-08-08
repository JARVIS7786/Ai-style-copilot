// src/services/mockApi.js

const MOCK_PRODUCTS = [
    { id: 'p1', name: 'Oversized Denim Jacket', brand: 'Urban Threads', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop', price: 1499, originalPrice: 2999, discount: 50, category: 'Jackets', matchReason: 'Matches your love for streetwear and denim.' },
    { id: 'p2', name: 'Classic White Sneakers', brand: 'StrideCo', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=800&fit=crop', price: 2199, originalPrice: 3499, discount: 37, category: 'Footwear', matchReason: 'Goes with 80% of items already in your closet.' },
    { id: 'p3', name: 'Floral Summer Dress', brand: 'Petal & Co.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop', price: 1899, originalPrice: 2799, discount: 32, category: 'Dresses', matchReason: 'You liked similar florals last week.' },
    { id: 'p4', name: 'Minimalist Analog Watch', brand: 'Horizon', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=800&fit=crop', price: 3499, originalPrice: 4999, discount: 30, category: 'Accessories', matchReason: 'Fits your minimalist style profile.' },
    { id: 'p5', name: 'Leather Crossbody Bag', brand: 'Maison Noir', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop', price: 2599, originalPrice: 3999, discount: 35, category: 'Bags', matchReason: 'Trending among users with your taste.' },
    { id: 'p6', name: 'Retro Round Sunglasses', brand: 'Solstice', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=800&fit=crop', price: 899, originalPrice: 1499, discount: 40, category: 'Accessories', matchReason: 'Pairs well with your recent likes.' }
];

const INTERACTIONS_KEY = 'swipe_interactions';
const USER_KEY = 'mock_user_id';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getUserId() {
    let userId = localStorage.getItem(USER_KEY);
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(USER_KEY, userId);
    }
    return userId;
}

// Ye purana export hai jo tere UI ko start karega
export async function getProducts() {
    await delay(300);
    return MOCK_PRODUCTS;
}

export async function recordInteraction(productId, action) {
    const interaction = {
        user_id: getUserId(),
        product_id: productId,
        action,
        timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]');
    existing.push(interaction);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(existing));

    await delay(100);
    return interaction;
}

export function getAllInteractions() {
    return JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]');
}

// Ye naya function hai tere real Render backend ke liye
export async function uploadRealOutfit(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
        const response = await fetch("https://ai-style-copilot.onrender.com/api/v1/style/analyze", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const aiData = await response.json();
        console.log("AI Result:", aiData);

        return {
            id: Math.random().toString(),
            name: aiData.style[0] || "AI Styled Outfit",
            brand: "AI Generated",
            image: URL.createObjectURL(imageFile),
            price: "N/A",
            originalPrice: "N/A",
            discount: 0,
            category: aiData.clothing[0]?.category || "Apparel",
            matchReason: `Detected Colors: ${aiData.dominant_colors.join(', ')}`,
            aiRawData: aiData
        };

    } catch (error) {
        console.error("Error uploading photo:", error);
        return null;
    }
}