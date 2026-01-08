package com.amfofana.school.repositories;

import com.amfofana.school.entities.Role;
import com.amfofana.school.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    @Query("SELECT u.email FROM User u")
    Set<String> findAllEmails();
    List<User> findByRole(Role role);
    long countByRole(Role role);
}
