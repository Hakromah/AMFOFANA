package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@Table(name = "classes")
public class Classe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String grade;


    // CHANGE: Changed from @ManyToOne to @ManyToMany
    @ManyToMany
    @JoinTable(
            name = "classe_teachers", // New join table for teachers
            joinColumns = @JoinColumn(name = "classe_id"),
            inverseJoinColumns = @JoinColumn(name = "teacher_id")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnoreProperties({"teachingClasses", "enrolledClasses", "password"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<User> teachers = new HashSet<>(); // Changed to a Set

    // Students remains the same
    @ManyToMany
    @JoinTable(
            name = "classe_students",
            joinColumns = @JoinColumn(name = "classe_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnoreProperties({"enrolledClasses", "teachingClasses", "password"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<User> students = new HashSet<>();
}
