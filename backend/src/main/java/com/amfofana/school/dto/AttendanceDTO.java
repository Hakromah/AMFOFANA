package com.amfofana.school.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceDTO {
    private Long classId;
    private LocalDate date;
    private List<AttendanceRecordDTO> records;

    @Data
    public static class AttendanceRecordDTO {
        private Long studentId;
        private boolean isPresent;
    }
}
