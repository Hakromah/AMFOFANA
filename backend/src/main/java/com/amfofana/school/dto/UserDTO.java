package com.amfofana.school.dto;

import com.amfofana.school.entities.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserDTO {

    private Long id;
    private String userId;

    @NotBlank(message = "Identity name is required")
    @Size(max = 100)
    private String name;

    @Email(message = "Valid institutional email required")
    @NotBlank(message = "Email cannot be empty")
    private String email;

    @NotBlank(message = "Initial security key required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Registry role must be assigned")
    private Role role; // Uses your existing Role enum

    @Past(message = "Birth date must be in the past")
    private LocalDate birthDate;

    private String birthCountry;
    private String birthCity;
    private String address;
    private String gender;
    private String phoneNumber;
    private LocalDateTime createdAt;
}
