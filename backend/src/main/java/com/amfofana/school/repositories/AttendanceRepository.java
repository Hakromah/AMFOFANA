package com.amfofana.school.repositories;

import com.amfofana.school.entities.Attendance;
import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM AttendanceRecord ar WHERE ar.student = :student")
    void deleteRecordsByStudent(@Param("student") User student);

    // FIX: Changed from findByStudent (broken) to a manual Join Query
    @Query("SELECT a FROM Attendance a JOIN a.records r WHERE r.student = :student")
    List<Attendance> findByRecordsStudent(@Param("student") User student);

    List<Attendance> findByClasseIdOrderByDateDesc(Long classId);

    long countByClasseIn(Collection<Classe> classes);

    @Query("SELECT COUNT(a) FROM Attendance a JOIN a.records r " +
            "WHERE r.student.id = :studentId AND r.present = true")
    long countPresentSessions(@Param("studentId") Long studentId);

    @Query("SELECT a FROM Attendance a JOIN a.records r WHERE r.student.id = :studentId")
    List<Attendance> findByRecordsStudentId(@Param("studentId") Long studentId);
}
