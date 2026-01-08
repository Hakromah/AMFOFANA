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
        return cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "raw",   // ✅ FORCE RAW
                        "folder", "lms_materials",
                        "use_filename", true,
                        "unique_filename", true,
                        "overwrite", false
                )
        );
    }


    public void delete(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }


}