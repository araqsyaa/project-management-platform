package com.projectmanagement.repository;

import com.projectmanagement.model.ProjectMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, Long> {
    Optional<ProjectMembership> findByProjectIdAndUserId(Long projectId, Long userId);
    List<ProjectMembership> findByProjectId(Long projectId);
    List<ProjectMembership> findByUserId(Long userId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
}
