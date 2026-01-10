package com.amfofana.school.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "material_downloads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialDownload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private LearningMaterial material;

    @ManyToOne(fetch = FetchType.LAZY)
    private Classe classe;

    @ManyToOne(fetch = FetchType.LAZY)
    private User downloadedBy;

    private LocalDateTime downloadedAt = LocalDateTime.now();
}

