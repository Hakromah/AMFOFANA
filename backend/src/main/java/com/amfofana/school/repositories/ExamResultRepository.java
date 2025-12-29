package com.amfofana.school.repositories;

import com.amfofana.school.entities.ExamResult;
import com.amfofana.school.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByStudent(User student);

    List<ExamResult> findByExam_Classe_Id(Long classId);

    List<ExamResult> findByStudent_Id(Long studentId);

    Optional<ExamResult> findByStudentIdAndExamId(Long studentId, Long examId);

    @Query("SELECT r FROM ExamResult r JOIN r.exam e WHERE r.student.id = :studentId AND e.semester = :semester")
    List<ExamResult> findByStudentIdAndSemester(@Param("studentId") Long studentId, @Param("semester") String semester);

    @Query("SELECT r FROM ExamResult r " +
            "JOIN FETCH r.student s " +
            "JOIN FETCH r.exam e " +
            "JOIN FETCH e.classe c " +  // Added this
            "JOIN FETCH e.subject sub " + // Added this
            "WHERE e.classe.id = :classId")
    List<ExamResult> findResultsByClassId(@Param("classId") Long classId);

    @Query(value = "SELECT er.* FROM exam_results er " +
            "JOIN users s ON s.id = er.student_id " +
            "JOIN exams e ON e.id = er.exam_id " +
            "JOIN classes c ON c.id = e.class_id " +
            "WHERE (?1 IS NULL OR ?1 = '' " +
            "   OR LOWER(CAST(s.name AS TEXT)) LIKE LOWER(CONCAT('%', CAST(?1 AS TEXT), '%')) " +
            "   OR CAST(s.user_id AS TEXT) LIKE CONCAT('%', CAST(?1 AS TEXT), '%')) " +
            "AND (?2 IS NULL OR c.id = ?2)",
            nativeQuery = true)
    List<ExamResult> findByAdminFilters(String studentQuery, Long classId);


    @Query("SELECT AVG(r.marks) FROM ExamResult r WHERE r.exam.id = :examId AND r.status = 'SUBMITTED' OR r.status = 'CREDITED'")
    Double getAverageByExamId(@Param("examId") Long examId);

    // Searches for exam results where the student's unique ID contains the search string
    List<ExamResult> findByStudent_UserIdContainingIgnoreCase(Long userId);

}
