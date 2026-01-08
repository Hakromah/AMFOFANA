package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", allocationSize = 50) // Matches batch_size
    private Long id;

    @Column(unique = true, length = 12)
    private String userId; // 12-digit unique ID

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Personal Information
    private LocalDate birthDate;
    private String birthCountry;
    private String birthCity;
    private String address;
    private String gender; // "Male" or "Female"
    private String phoneNumber;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToMany(mappedBy = "teachers") // Must match the field name in Classe
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Set<Classe> teachingClasses = new HashSet<>();


    @ManyToMany(mappedBy = "students")
    @OnDelete(action = OnDeleteAction.CASCADE) // ADD THIS HERE
    @JsonIgnore
    @ToString.Exclude // ADD THIS
    @EqualsAndHashCode.Exclude // ADD THIS
    private Set<Classe> enrolledClasses = new HashSet<>();
}
