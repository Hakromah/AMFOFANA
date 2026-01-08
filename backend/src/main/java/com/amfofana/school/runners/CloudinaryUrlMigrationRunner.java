//package com.amfofana.school.runners;
//
//import com.amfofana.school.services.TeacherMaterialService;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.stereotype.Component;
//
//@Component
//public class CloudinaryUrlMigrationRunner implements CommandLineRunner {
//
//    private final TeacherMaterialService materialService;
//
//    public CloudinaryUrlMigrationRunner(TeacherMaterialService materialService) {
//        this.materialService = materialService;
//    }
//
//
//    @Override
//    public void run(String... args) {
//        materialService.fixBrokenCloudinaryUrls();
//        System.out.println("✔ Cloudinary URL migration completed");
//    }
//}
