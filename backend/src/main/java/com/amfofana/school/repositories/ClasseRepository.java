package com.amfofana.school.repositories;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.Exam;
import com.amfofana.school.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClasseRepository extends JpaRepository<Classe, Long> {
    @Query("SELECT DISTINCT c FROM Classe c " +
            "JOIN c.teachers t " +
            "LEFT JOIN FETCH c.students " +
            "WHERE t.id = :teacherId")
    List<Classe> findByTeacherWithStudents(@Param("teacherId") Long teacherId);

    // 2. Updated for ManyToMany: Find classes where the teachers set contains this user
    List<Classe> findByTeachersContains(User teacher);

    // 3. This remains the same as students was already ManyToMany
    List<Classe> findByStudentsContains(User student);

    boolean existsByIdAndTeachers_Id(Long classId, Long teacherId);
}

