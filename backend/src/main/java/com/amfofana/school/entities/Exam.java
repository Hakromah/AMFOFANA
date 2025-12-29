package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'Exam'")
    private String name;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE) // ADD THIS HERE
    @JoinColumn(name = "class_id", nullable = false)
    @ToString.Exclude // ADD THIS
    @EqualsAndHashCode.Exclude // ADD THIS
    @JsonIgnoreProperties({"teachers", "students"})
    private Classe classe;

    @ManyToOne
    @JoinColumn(name = "teacher_id") // The specific teacher who created it
    @JsonIgnoreProperties({"teachingClasses", "enrolledClasses", "password"})
    private User teacher;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // ADD THIS HERE
    @ToString.Exclude // ADD THIS
    @EqualsAndHashCode.Exclude // ADD THIS
    private Subject subject;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime; // Added start time

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    private Term term; // MIDTERM, FINAL, QUIZ_1, QUIZ_2

    @Column(nullable = false)
    private String semester; // e.g., "Fall 2025"

    private Integer weight; // e.g., 30 for midterm, 70 for final

    private boolean isLocked = false; // To prevent edits after semester closure// Added end time


}
