package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exam_results")
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnoreProperties({"classe", "teacher"})
    private Exam exam;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"teachingClasses", "enrolledClasses", "password"})
    private User student;

    @Column(nullable = false)
    private Double marks;

    @Enumerated(EnumType.STRING)
    private Grade grade; // Optional

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.DRAFT; // Default to DRAFT

    public enum Status {
        DRAFT, SUBMITTED, GRADED
    }

    private String letterGrade;
}
