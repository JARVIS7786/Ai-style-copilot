// Ye function teri real photo backend ko bhejega
export async function uploadRealOutfit(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile); // Backend "image" expect karta hai

    try {
        // Yahan Apna Render wala URL daal dena
        const response = await fetch("https://ai-style-copilot.onrender.com/api/v1/style/analyze", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const aiData = await response.json();
        console.log("AI Result:", aiData);

        // AI data ko apne card wale format mein convert kar rahe hain
        return {
            id: Math.random().toString(),
            name: aiData.style[0] || "AI Styled Outfit", // AI ka pehla style as title
            brand: "AI Generated",
            image: URL.createObjectURL(imageFile), // Jo photo upload ki wahi dikhegi
            price: "N/A",
            originalPrice: "N/A",
            discount: 0,
            category: aiData.clothing[0]?.category || "Apparel",
            matchReason: `Detected Colors: ${aiData.dominant_colors.join(', ')}`,
            aiRawData: aiData // Pura data card mein save kar liya
        };

    } catch (error) {
        console.error("Error uploading photo:", error);
        return null;
    }
}