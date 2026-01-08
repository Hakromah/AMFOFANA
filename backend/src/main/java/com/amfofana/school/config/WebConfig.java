//package com.amfofana.school.config;
//
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//import java.nio.file.Path;
//import java.nio.file.Paths;
//
//@Configuration
//public class WebConfig implements WebMvcConfigurer {
//
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        exposeDirectory("uploads/materials", registry);
//    }
//
//    private void exposeDirectory(String dirName, ResourceHandlerRegistry registry) {
//        Path uploadDir = Paths.get(dirName);
//        String uploadPath = uploadDir.toFile().getAbsolutePath();
//
//        // This tells Spring: "If a request comes in for /api/files/materials/**,
//        // look inside the physical 'uploads/materials' folder on the hard drive."
//        registry.addResourceHandler("/api/files/materials/**")
//                .addResourceLocations("file:/" + uploadPath + "/");
//    }
//}
