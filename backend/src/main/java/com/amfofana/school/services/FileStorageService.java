//package com.amfofana.school.services;
//
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//
//@Service
//public class FileStorageService {
//
//    private final Path root = Paths.get("uploads/materials");
//
//    public String store(MultipartFile file) throws IOException {
//        if (!Files.exists(root)) Files.createDirectories(root);
//        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
//        Files.copy(file.getInputStream(), this.root.resolve(fileName));
//        return fileName;
//    }
//
//    public void delete(String fileName) {
//        try {
//            Files.deleteIfExists(this.root.resolve(fileName));
//        } catch (IOException e) {
//            throw new RuntimeException("Could not delete file: " + fileName);
//        }
//    }
//}
//
