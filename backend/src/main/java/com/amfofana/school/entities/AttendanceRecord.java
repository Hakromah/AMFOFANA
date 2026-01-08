package com.amfofana.school.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE) // Add this!
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User student;

    // Use 'present' - Lombok will generate setPresent()
    private boolean present;

    // Bidirectional link back to parent (Optional but recommended for consistency)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id")
    @JsonBackReference
    private Attendance attendance;

}
