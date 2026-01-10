package com.amfofana.school.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudStorageService {


    private final Cloudinary cloudinary;

    public CloudStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map<?, ?> upload(MultipartFile file) throws IOException {

        // Determine if it's an image or a document (PDF/Docx)
        String contentType = file.getContentType();
        String resourceType = "auto"; // Default

        if (contentType != null && contentType.contains("pdf")) {
            resourceType = "image";
        }

        return cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", resourceType,
                        "folder", "lms_materials",
                        "use_filename", true,
                        "unique_filename", true,
                        "access_mode", "public"
                ));
    }


    public void delete(String publicId, String fileType) throws IOException {
        String resourceType = "image";

        // If the file is not an image or PDF, it was likely stored as 'raw'
        if (fileType != null && !fileType.contains("image") && !fileType.contains("pdf")) {
            resourceType = "raw";
        }

        cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
    }

}