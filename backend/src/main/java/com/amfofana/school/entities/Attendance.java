package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "class_id", nullable = false)
    private Classe classe;

    @Column(nullable = false)
    private LocalDate date;

    // This is the only place student data should live now
    @OneToMany(mappedBy = "attendance", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<AttendanceRecord> records = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "attendance_id")
    @JsonBackReference
    private Attendance attendance;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student; // This must be named 'student' for the countByStudent_Id to work

    private String status; //

}
