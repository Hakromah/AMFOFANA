package com.amfofana.school.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "timetables", indexes = {
        @Index(name = "idx_timetable_class", columnList = "class_id")
})
public class Timetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "class_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // Automatically delete timetable entries when a class is deleted
    private Classe classe;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;
}
