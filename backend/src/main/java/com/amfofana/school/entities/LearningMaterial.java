package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "learning_materials")
public class LearningMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    private String fileType;
    private Long fileSize;

    @Column(name = "public_id", nullable = false)
    private String publicId;


    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({
            "teachingClasses",
            "enrolledClasses",
            "password",
            "authorities",
            "accountNonExpired",
            "accountNonLocked",
            "credentialsNonExpired",
            "enabled"
    })
    private User uploadedBy;

    @ManyToMany
    @JoinTable(
            name = "material_classes",
            joinColumns = @JoinColumn(name = "material_id"),
            inverseJoinColumns = @JoinColumn(name = "class_id")
    )
    private Set<Classe> targetClasses = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

}
