package com.amfofana.school.services;

import com.amfofana.school.dto.AttendanceDTO;
import com.amfofana.school.dto.MarksDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeacherService {

    private String convertToLetter(Double marks) {
        if (marks == null) return "-";
        if (marks >= 90) return "AA";
        if (marks >= 85) return "BA";
        if (marks >= 80) return "BB";
        if (marks >= 75) return "CB";
        if (marks >= 70) return "CC";
        if (marks >= 60) return "DC";
        if (marks >= 50) return "DD";
        return "FF";
    }

    private final ClasseRepository classeRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExamResultRepository examResultRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final TimetableRepository timetableRepository;


    public TeacherService(ClasseRepository classeRepository,
                          AttendanceRepository attendanceRepository,
                          ExamResultRepository examResultRepository,
                          UserRepository userRepository,
                          ExamRepository examRepository,
                          LearningMaterialRepository learningMaterialRepository,
                          SubjectRepository subjectRepository,
                          PasswordEncoder passwordEncoder, TimetableRepository timetableRepository) {
        this.classeRepository = classeRepository;
        this.attendanceRepository = attendanceRepository;
        this.examResultRepository = examResultRepository;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.subjectRepository = subjectRepository;
        this.passwordEncoder = passwordEncoder;
        this.timetableRepository = timetableRepository;
    }

    public List<Classe> getClassesByTeacher(Long teacherId) {
//        User teacher = new User();
//        teacher.setId(teacherId);
        User teacher = userRepository.getReferenceById(teacherId);
        return classeRepository.findByTeachersContains(teacher);
    }

    //    GET STUDENTS BY TEACHER
    @Transactional(readOnly = true) // This keeps the DB session open during the stream
    public List<User> getStudentsByTeacher(Long teacherId) {
        List<Classe> classes = classeRepository.findByTeacherWithStudents(teacherId);

        return classes.stream()
                .flatMap(classe -> classe.getStudents().stream())
                .distinct()
                .collect(Collectors.toList());
    }

    //GET STUDENTS BY CLASS
    public List<User> getStudentsByClass(Long teacherId, Long classId) {
        Classe classe = classeRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // NEW SECURITY CHECK: Verify if the teacherId is in the set of teachers for this class
        boolean isAssigned = classe.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacherId));

        // Faster check using the Repository
        if (!classeRepository.existsByIdAndTeachers_Id(classId, teacherId)) {
            throw new RuntimeException("Access denied: This is not one of your classes.");
        }

        return new ArrayList<>(classe.getStudents());
    }

    //SUBMIT ATTENDANCE
    @Transactional
    public void submitAttendance(AttendanceDTO dto) {
        Classe classe = classeRepository.findById(dto.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Attendance attendance = new Attendance();
        attendance.setClasse(classe);
        attendance.setDate(dto.getDate());

        List<AttendanceRecord> records = new ArrayList<>();

        for (AttendanceDTO.AttendanceRecordDTO recordDto : dto.getRecords()) {
            User student = userRepository.findById(recordDto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            AttendanceRecord record = new AttendanceRecord();
            record.setStudent(student);

            record.setPresent(recordDto.isPresent());

            // Link record back to the parent attendance session
            record.setAttendance(attendance);

            records.add(record);
        }

        attendance.setRecords(records);
        // CascadeType.ALL will now save the Attendance AND all its Records in one go
        attendanceRepository.save(attendance);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceHistory(Long classId) {
        return attendanceRepository.findByClasseIdOrderByDateDesc(classId).stream()
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", a.getId());
                    map.put("date", a.getDate());
                    map.put("presentCount", a.getRecords().stream().filter(AttendanceRecord::isPresent).count());
                    map.put("totalCount", a.getRecords().size());
                    return map;
                }).collect(Collectors.toList());
    }

    @Transactional
    public void updateAttendance(Long attendanceId, AttendanceDTO dto) {
        Attendance existing = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        // 1. Update the date if changed
        existing.setDate(dto.getDate());

        // 2. Clear old records
        // orphanRemoval = true in the Entity will delete these from the database automatically
        existing.getRecords().clear();

        // 3. Re-add new records from the DTO
        for (AttendanceDTO.AttendanceRecordDTO recordDto : dto.getRecords()) {
            User student = userRepository.findById(recordDto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            AttendanceRecord record = new AttendanceRecord();
            record.setStudent(student);
            record.setPresent(recordDto.isPresent());
            record.setAttendance(existing); // Important: Link back to parent

            existing.getRecords().add(record);
        }

        attendanceRepository.save(existing);
    }

    public void submitMarks(MarksDTO marksDTO) {
        Exam exam = examRepository.findById(marksDTO.getExamId()).orElseThrow(() -> new RuntimeException("Exam not found"));
        for (MarksDTO.MarkRecordDTO record : marksDTO.getMarks()) {
            User student = userRepository.findById(record.getStudentId()).orElseThrow(() -> new RuntimeException("Student not found"));
            ExamResult examResult = new ExamResult();
            examResult.setExam(exam);
            examResult.setStudent(student);
            examResult.setMarks(record.getScore());
            examResultRepository.save(examResult);
        }
    }

    // CREATE EXAM
    @Transactional
    public Exam createExam(Long teacherId, Exam exam) {
        User creator = userRepository.findById(teacherId).orElseThrow();

        // Fetch the real Class object from DB using the ID sent from frontend
        Classe classe = classeRepository.findById(exam.getClasse().getId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        exam.setTeacher(creator);
        exam.setClasse(classe);

        return examRepository.save(exam);
    }

    @Transactional(readOnly = true)
    public List<Exam> getExamsByTeacher(Long teacherId) {
        return examRepository.findExamsByTeacherId(teacherId);
    }

    // ExamService.java

    @Transactional
    public Exam updateExam(Long id, Exam details, Long teacherId) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        // Security check: Only the creator can edit (unless Admin, but here focused on teacher)
        if (!exam.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Unauthorized to edit this exam");
        }

        if (exam.isLocked()) {
            throw new RuntimeException("Exam is locked and cannot be modified");
        }

        exam.setDate(details.getDate());
        exam.setStartTime(details.getStartTime());
        exam.setEndTime(details.getEndTime());
        exam.setWeight(details.getWeight());
        exam.setTerm(details.getTerm());
        exam.setSemester(details.getSemester());

        // Update relationships if changed
        if (details.getClasse() != null) {
            Classe classe = classeRepository.findById(details.getClasse().getId()).orElseThrow();
            exam.setClasse(classe);
        }

        return examRepository.save(exam);
    }

    @Transactional
    public void deleteExam(Long id, Long teacherId) {
        Exam exam = examRepository.findById(id).orElseThrow();
        if (!exam.getTeacher().getId().equals(teacherId)) throw new RuntimeException("Unauthorized");
        if (exam.isLocked()) throw new RuntimeException("Cannot delete locked exam");

        examRepository.deleteById(id);
    }

    @Transactional
    public Exam toggleExamStatus(Long id, boolean closed) {
        System.out.println("Toggling exam " + id + " to status: " + closed); // Debug Log
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam with ID " + id + " not found"));

        exam.setClosed(closed);
        return examRepository.save(exam);
    }

    public List<ExamResult> getGradebookByClass(Long teacherId, Long classId) {
        // Security check: Ensure teacher belongs to this class
        if (!classeRepository.existsByIdAndTeachers_Id(classId, teacherId)) {
            throw new RuntimeException("Unauthorized access to this class gradebook.");
        }
        return examResultRepository.findResultsByClassId(classId);
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public User updateProfile(Long userId, Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(payload.get("name"));
        user.setEmail(payload.get("email"));
        return userRepository.save(user);
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public ExamResult saveResult(Long teacherId, ExamResult result) {

        // 1. Check if result already exists for this Student + Exam combination
        Optional<ExamResult> existing = examResultRepository.findByStudentIdAndExamId(
                result.getStudent().getId(),
                result.getExam().getId()
        );

        if (existing.isPresent()) {
            throw new RuntimeException("A result for this student in this exam already exists. Please edit the existing record instead.");
        }

        // 2. Fetch Exam for security check
        Exam exam = examRepository.findById(result.getExam().getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        // NEW CHECK: Prevent editing if the semester is locked
        if (exam.isLocked()) {
            throw new RuntimeException("This semester has been closed. You cannot modify results.");
        }

        // 3. Security Check: Is the current teacher assigned to this exam's class?
        boolean isAuthorized = exam.getClasse().getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacherId));

        if (!isAuthorized) {
            throw new RuntimeException("Access Denied: You are not a teacher for this class.");
        }

        result.setStatus(ExamResult.Status.DRAFT);
        return examResultRepository.save(result);
    }


    @Transactional
    public Map<String, Object> saveBulkResults(Long teacherId, List<ExamResult> results) {
        int updated = 0;
        int created = 0;

        for (ExamResult incoming : results) {
            Long studentId = incoming.getStudent().getId();
            Long examId = incoming.getExam().getId();

            // 1. Fetch the Exam to get its linked Subject and verify the Teacher
            Exam exam = examRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("Exam not found for ID: " + examId));

            // Assuming your Exam entity has a getSubject() method
            Long subjectId = exam.getSubject().getId();

            // 2. Authorization Check: Is this teacher assigned to the class?
            boolean isAuthorized = exam.getClasse().getTeachers().stream()
                    .anyMatch(t -> t.getId().equals(teacherId));

            if (!isAuthorized) {
                throw new RuntimeException("Unauthorized: You are not assigned to " + exam.getClasse().getName());
            }

            // 3. Use your existing Repository Method
            Optional<ExamResult> existingRecord = examResultRepository
                    .findByStudentIdAndExamIdAndSubjectId(studentId, examId, subjectId);

            ExamResult recordToSave;
            if (existingRecord.isPresent()) {
                recordToSave = existingRecord.get();
                updated++;
            } else {
                recordToSave = new ExamResult();
                recordToSave.setStudent(userRepository.getReferenceById(studentId));
                recordToSave.setExam(exam);
                created++;
            }

            // 4. Set fields that exist in your ExamResult Entity
            recordToSave.setMarks(incoming.getMarks());
            recordToSave.setLetterGrade(convertToLetter(incoming.getMarks()));
            recordToSave.setStatus(ExamResult.Status.SUBMITTED);

            examResultRepository.save(recordToSave);
        }

        // 5. Return Summary for the UI Toast
        Map<String, Object> summary = new HashMap<>();
        summary.put("created", created);
        summary.put("updated", updated);
        summary.put("total", results.size());
        return summary;
    }

    public ExamResult updateResult(Long id, ExamResult resultDetails) {
        ExamResult result = examResultRepository.findById(id).orElseThrow(() -> new RuntimeException("Result not found"));
        if (result.getStatus() == ExamResult.Status.SUBMITTED || result.getStatus() == ExamResult.Status.GRADED) {
            throw new RuntimeException("Cannot update a submitted result");
        }
        result.setMarks(resultDetails.getMarks());
        result.setGrade(resultDetails.getGrade());
        return examResultRepository.save(result);
    }

    public void submitResults(List<Long> resultIds) {
        List<ExamResult> results = examResultRepository.findAllById(resultIds);
        for (ExamResult result : results) {
            result.setStatus(ExamResult.Status.SUBMITTED);
        }
        examResultRepository.saveAll(results);
    }

    public List<ExamResult> getResultsByTeacher(Long teacherId) {
        List<User> students = getStudentsByTeacher(teacherId);
        return students.stream()
                .flatMap(student -> examResultRepository.findByStudent(student).stream())
                .collect(Collectors.toList());
    }

    // Change the parameter type to String to handle "AMF-2025-001" etc.
    public List<Map<String, Object>> filterResults(Long classId, String studentId) {
        List<ExamResult> rawResults;

        // 1. Logic for searching by the public User ID String
        if (studentId != null && !studentId.trim().isEmpty()) {
            // We search by the public userId instead of the private database id
            rawResults = examResultRepository.findByStudent_UserIdContainingIgnoreCase(studentId);
        }
        // 2. Logic for filtering by Class
        else if (classId != null) {
            rawResults = examResultRepository.findByExam_Classe_Id(classId);
        }
        // 3. Default: Find all
        else {
            rawResults = examResultRepository.findAll();
        }

        return rawResults.stream().map(result -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", result.getId());
            dto.put("marks", result.getMarks());
            dto.put("status", result.getStatus());
            dto.put("grade", result.getLetterGrade());

            // Student Mapping
            Map<String, Object> studentMap = new HashMap<>();
            studentMap.put("name", result.getStudent().getName());
            studentMap.put("userId", result.getStudent().getUserId()); // This is what the frontend displays
            dto.put("student", studentMap);

            // Exam Mapping
            Map<String, Object> examMap = new HashMap<>();
            examMap.put("id", result.getExam().getId());
            examMap.put("name", result.getExam().getName());
            examMap.put("term", result.getExam().getTerm());
            examMap.put("weight", result.getExam().getWeight());
            examMap.put("locked", result.getExam().isLocked());

            // Class Mapping
            Map<String, Object> classeMap = new HashMap<>();
            classeMap.put("name", result.getExam().getClasse().getName());
            examMap.put("classe", classeMap);

            if (result.getExam().getSubject() != null) {
                Map<String, Object> subMap = new HashMap<>();
                subMap.put("name", result.getExam().getSubject().getName());
                examMap.put("subject", subMap);
            }

            dto.put("exam", examMap);
            return dto;
        }).collect(Collectors.toList());
    }

    //TIMETABLE
    public List<Timetable> getTeacherTimetable(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        return timetableRepository.findByClasseInOrderByDayOfWeekAscStartTimeAsc(teacher.getTeachingClasses());
    }

}
