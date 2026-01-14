package com.amfofana.school.repositories;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.Exam;
import com.amfofana.school.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
//    List<Exam> findByClasse_Teacher(User teacher);

    List<Exam> findByClasse(Classe classe);

    @Query("SELECT e FROM Exam e " +
            "JOIN e.classe c " +
            "JOIN c.teachers t " +
            "WHERE t.id = :teacherId")
    List<Exam> findExamsByTeacherId(@Param("teacherId") Long teacherId);

    List<Exam> findBySemester(String semester);


    List<Exam> findByClasseIn(Collection<Classe> enrolledClasses);

    List<Exam> findByTeacherIdAndClasseId(Long teacherId, Long classId);

    List<Exam> findByClasseId(Long classId);

    // Find the next upcoming exam for a student's class
    Optional<Exam> findFirstByClasse_IdAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(Long classId, LocalDate date);

}
