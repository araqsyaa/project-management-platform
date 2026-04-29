package com.projectmanagement.repository;

import com.projectmanagement.model.ProjectInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectInviteRepository extends JpaRepository<ProjectInvite, Long> {
    Optional<ProjectInvite> findByToken(String token);
    List<ProjectInvite> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
