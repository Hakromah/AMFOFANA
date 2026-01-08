package com.amfofana.school.repositories;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    // Find timetable by a specific class ID
    List<Timetable> findByClasseId(Long classId);

    // Find timetable for a list of classes (useful for students/teachers)
    List<Timetable> findByClasseInOrderByDayOfWeekAscStartTimeAsc(Collection<Classe> classes);
}
