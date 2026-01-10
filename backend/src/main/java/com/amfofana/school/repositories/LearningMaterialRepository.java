package com.amfofana.school.repositories;

import com.amfofana.school.entities.LearningMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {


    @Query("SELECT DISTINCT m FROM LearningMaterial m " +
            "JOIN FETCH m.uploadedBy " +
            "JOIN m.targetClasses c " +
            "WHERE c.id = :classId " +
            "ORDER BY m.createdAt DESC")
    List<LearningMaterial> findByClassId(@Param("classId") Long classId);

    @Query("SELECT DISTINCT m FROM LearningMaterial m " +
            "LEFT JOIN FETCH m.targetClasses " +
            "JOIN FETCH m.uploadedBy " +
            "WHERE m.uploadedBy.email = :email " +
            "ORDER BY m.createdAt DESC")
    List<LearningMaterial> findByUploadedByEmailOrderByCreatedAtDesc(@Param("email") String email);

    @Query("""
                SELECT DISTINCT m FROM LearningMaterial m
                LEFT JOIN FETCH m.targetClasses
                JOIN FETCH m.uploadedBy
                ORDER BY m.createdAt DESC
            """)
    List<LearningMaterial> findAllWithRelations();

    @Query("""
    SELECT DISTINCT m FROM LearningMaterial m
    LEFT JOIN FETCH m.targetClasses
    JOIN FETCH m.uploadedBy
    WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :q, '%'))
       OR LOWER(m.description) LIKE LOWER(CONCAT('%', :q, '%'))
       OR LOWER(m.uploadedBy.name) LIKE LOWER(CONCAT('%', :q, '%'))
""")
    List<LearningMaterial> search(@Param("q") String q);


}
