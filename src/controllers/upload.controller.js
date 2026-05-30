import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Pass the file buffer to Cloudinary instead of a local file path
        const fileBuffer = req.file.buffer;
        
        // Upload to cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(fileBuffer);

        if (!cloudinaryResponse) {
            return res.status(500).json({ success: false, message: "Error uploading file to Cloudinary" });
        }

        return res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: {
                url: cloudinaryResponse.url,
                secure_url: cloudinaryResponse.secure_url,
                public_id: cloudinaryResponse.public_id
            }
        });

    } catch (error) {
        console.error("Upload controller error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

export { uploadFile };
