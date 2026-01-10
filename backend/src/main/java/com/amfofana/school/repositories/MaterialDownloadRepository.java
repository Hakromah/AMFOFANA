package com.amfofana.school.repositories;

import com.amfofana.school.entities.MaterialDownload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialDownloadRepository extends JpaRepository<MaterialDownload, Long> {

    @Query("""
        SELECT c.name, COUNT(d.id)
        FROM MaterialDownload d
        JOIN d.classe c
        GROUP BY c.name
    """)
    List<Object[]> countDownloadsPerClass();
}
