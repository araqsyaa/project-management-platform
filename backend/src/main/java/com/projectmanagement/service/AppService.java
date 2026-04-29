package com.projectmanagement.service;

import com.projectmanagement.model.*;
import com.projectmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppService {

    private final UserRepository userRepo;
    private final TeamRepository teamRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMembershipRepository projectMembershipRepo;
    private final ProjectInviteRepository projectInviteRepo;
    private final MilestoneRepository milestoneRepo;
    private final TaskRepository taskRepo;
    private final CommentRepository commentRepo;
    private final NotificationRepository notificationRepo;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, Long> tokenStore;

    // Auth
    public Map<String, Object> register(Map<String, String> body) {
        if (userRepo.existsByEmail(body.get("email")))
            throw new IllegalArgumentException("Email already exists");
        User u = new User();
        u.setName(body.get("name"));
        u.setEmail(body.get("email"));
        u.setPassword(passwordEncoder.encode(body.get("password")));
        u.setRole(body.containsKey("role") ? User.Role.valueOf(body.get("role")) : User.Role.TEAM_MEMBER);
        u = userRepo.save(u);
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, u.getId());
        return Map.of("user", u, "token", token);
    }

    public Map<String, Object> login(Map<String, String> body) {
        User u = userRepo.findByEmail(body.get("email"))
                .filter(x -> passwordEncoder.matches(body.get("password"), x.getPassword()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, u.getId());
        return Map.of("user", u, "token", token);
    }

    public void logout(String token) {
        tokenStore.remove(token);
    }

    // Users
    public List<User> getUsers() { return userRepo.findAll(); }
    public Optional<User> getUser(Long id) { return userRepo.findById(id); }
    public Optional<User> getCurrentUser(Long actorId) {
        if (actorId == null) {
            return Optional.empty();
        }
        return userRepo.findById(actorId);
    }

    // Teams
    public List<Team> getTeams() { return teamRepo.findAll(); }
    public Optional<Team> getTeam(Long id) { return teamRepo.findById(id); }
    public Team createTeam(Team t) { return teamRepo.save(t); }
    public void addTeamMember(Long teamId, Long userId) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();
        team.getMembers().add(user);
        user.getTeams().add(team);
        teamRepo.save(team);
        userRepo.save(user);
    }

    // Projects
    public List<Project> getProjects(Long actorId) {
        if (actorId == null) {
            return List.of();
        }
        return projectMembershipRepo.findByUserId(actorId).stream()
                .map(ProjectMembership::getProject)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(Project::getId).reversed())
                .collect(Collectors.toList());
    }
    public Optional<Project> getProject(Long id, Long actorId) {
        Project project = requireProjectMember(id, actorId);
        return Optional.of(project);
    }
    public List<Project> getProjectsByTeam(Long teamId, Long actorId) {
        if (actorId == null) {
            return List.of();
        }
        List<Long> memberProjectIds = projectMembershipRepo.findByUserId(actorId).stream()
                .map(ProjectMembership::getProject)
                .filter(Objects::nonNull)
                .map(Project::getId)
                .filter(Objects::nonNull)
                .toList();
        if (memberProjectIds.isEmpty()) {
            return List.of();
        }
        return projectRepo.findByTeamId(teamId).stream()
                .filter(project -> memberProjectIds.contains(project.getId()))
                .toList();
    }
    public Project createProject(Project p, Long actorId) {
        if (actorId == null) {
            throw new AccessDeniedException("Authentication is required");
        }
        Project saved = projectRepo.save(p);
        User owner = userRepo.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ProjectMembership membership = new ProjectMembership();
        membership.setProject(saved);
        membership.setUser(owner);
        membership.setRole(ProjectMembership.Role.OWNER);
        membership.setJoinedAt(LocalDateTime.now());
        projectMembershipRepo.save(membership);
        createActivity(
                actorId,
                "project",
                "Project created",
                actorName(actorId) + " created project \"" + saved.getName() + "\"",
                projectPath(saved)
        );
        return saved;
    }
    public Project updateProject(Project p, Long actorId) {
        Project existing = requireProjectOwner(p.getId(), actorId);
        String previousName = existing.getName();
        LocalDate previousEndDate = existing.getEndDate();
        existing.setName(p.getName());
        existing.setDescription(p.getDescription());
        existing.setStartDate(p.getStartDate());
        existing.setEndDate(p.getEndDate());
        existing.setTeam(p.getTeam());
        Project saved = projectRepo.save(existing);
        String message = !Objects.equals(previousName, saved.getName())
                ? actorName(actorId) + " renamed project to \"" + saved.getName() + "\""
                : !Objects.equals(previousEndDate, saved.getEndDate())
                    ? actorName(actorId) + " updated the deadline for project \"" + saved.getName() + "\""
                    : actorName(actorId) + " updated project \"" + saved.getName() + "\"";
        createActivity(
                actorId,
                "project",
                "Project updated",
                message,
                projectPath(saved)
        );
        return saved;
    }
    public void deleteProject(Long id, Long actorId) {
        Project existing = requireProjectOwner(id, actorId);

        List<Task> projectTasks = taskRepo.findByProjectId(id);
        if (!projectTasks.isEmpty()) {
            taskRepo.deleteAll(projectTasks);
        }

        List<Milestone> projectMilestones = milestoneRepo.findByProjectId(id);
        if (!projectMilestones.isEmpty()) {
            milestoneRepo.deleteAll(projectMilestones);
        }
        List<ProjectInvite> projectInvites = projectInviteRepo.findByProjectIdOrderByCreatedAtDesc(id);
        if (!projectInvites.isEmpty()) {
            projectInviteRepo.deleteAll(projectInvites);
        }
        List<ProjectMembership> memberships = projectMembershipRepo.findByProjectId(id);
        if (!memberships.isEmpty()) {
            projectMembershipRepo.deleteAll(memberships);
        }

        String projectName = existing.getName();
        projectRepo.delete(existing);

        createActivity(
                actorId,
                "project",
                "Project deleted",
                actorName(actorId) + " deleted project \"" + projectName + "\"",
                "/projects"
        );
    }

    // Milestones
    public List<Milestone> getMilestones(Long projectId, Long actorId) {
        requireProjectMember(projectId, actorId);
        return milestoneRepo.findByProjectId(projectId);
    }
    public Optional<Milestone> getMilestone(Long id, Long actorId) {
        Milestone milestone = milestoneRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        requireProjectMember(milestone.getProject().getId(), actorId);
        return Optional.of(milestone);
    }
    public Milestone createMilestone(Long projectId, Milestone m, Long actorId) {
        requireProjectMember(projectId, actorId);
        m.setProject(projectRepo.findById(projectId).orElseThrow());
        Milestone created = milestoneRepo.save(m);
        createActivity(
                actorId,
                "milestone",
                "Milestone created",
                actorName(actorId) + " created milestone \"" + created.getName() + "\" in " + projectName(created.getProject()),
                projectPath(created.getProject())
        );
        return created;
    }
    public Milestone updateMilestone(Long projectId, Long milestoneId, String name, String description,
                                     LocalDate dueDate, List<Long> taskIds, Long actorId) {
        requireProjectMember(projectId, actorId);
        Milestone m = milestoneRepo.findById(milestoneId)
                .filter(mil -> mil.getProject() != null && mil.getProject().getId().equals(projectId))
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        String previousName = m.getName();
        LocalDate previousDueDate = m.getDueDate();
        m.setName(name);
        m.setDescription(description);
        m.setDueDate(dueDate);
        List<Task> projectTasks = taskRepo.findByProjectId(projectId);
        for (Task t : projectTasks) {
            if (taskIds != null && taskIds.contains(t.getId())) {
                t.setMilestone(m);
                taskRepo.save(t);
            } else if (m.equals(t.getMilestone())) {
                t.setMilestone(null);
                taskRepo.save(t);
            }
        }
        List<Task> assigned = taskRepo.findByMilestoneId(milestoneId);
        m.setCompleted(assigned.stream().allMatch(t -> t.getStatus() == Task.Status.DONE));
        Milestone saved = milestoneRepo.save(m);
        String changeSummary = !Objects.equals(previousName, saved.getName())
                ? "renamed milestone to \"" + saved.getName() + "\""
                : !Objects.equals(previousDueDate, saved.getDueDate())
                    ? "updated milestone deadline for \"" + saved.getName() + "\""
                    : "updated milestone \"" + saved.getName() + "\"";
        createActivity(
                actorId,
                "milestone",
                "Milestone updated",
                actorName(actorId) + " " + changeSummary + " in " + projectName(saved.getProject()),
                projectPath(saved.getProject())
        );
        return saved;
    }
    public void deleteMilestone(Long projectId, Long milestoneId, Long actorId) {
        requireProjectMember(projectId, actorId);
        Milestone m = milestoneRepo.findById(milestoneId)
                .filter(mil -> mil.getProject() != null && mil.getProject().getId().equals(projectId))
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        String milestoneName = m.getName();
        Project project = m.getProject();
        List<Task> assigned = taskRepo.findByMilestoneId(milestoneId);
        for (Task task : assigned) {
            task.setMilestone(null);
            taskRepo.save(task);
        }
        milestoneRepo.delete(m);
        createActivity(
                actorId,
                "milestone",
                "Milestone deleted",
                actorName(actorId) + " deleted milestone \"" + milestoneName + "\" from " + projectName(project),
                projectPath(project)
        );
    }

    // Tasks
    public List<Task> getTasks(Long actorId) {
        if (actorId == null) {
            return List.of();
        }
        List<Long> memberProjectIds = projectMembershipRepo.findByUserId(actorId).stream()
                .map(ProjectMembership::getProject)
                .filter(Objects::nonNull)
                .map(Project::getId)
                .filter(Objects::nonNull)
                .toList();
        return taskRepo.findAll().stream()
                .filter(task -> task.getProject() != null && memberProjectIds.contains(task.getProject().getId()))
                .toList();
    }
    public Optional<Task> getTask(Long id, Long actorId) {
        Task task = taskRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        requireProjectMember(task.getProject().getId(), actorId);
        return Optional.of(task);
    }
    public List<Task> getTasksByProject(Long projectId, Long actorId) {
        requireProjectMember(projectId, actorId);
        return taskRepo.findByProjectId(projectId);
    }
    public List<Task> getTasksByAssignee(Long userId, Long actorId) {
        if (actorId == null) {
            return List.of();
        }
        List<Long> memberProjectIds = projectMembershipRepo.findByUserId(actorId).stream()
                .map(ProjectMembership::getProject)
                .filter(Objects::nonNull)
                .map(Project::getId)
                .filter(Objects::nonNull)
                .toList();
        return taskRepo.findByAssigneeId(userId).stream()
                .filter(task -> task.getProject() != null && memberProjectIds.contains(task.getProject().getId()))
                .toList();
    }
    public Task createTask(Task t, Long actorId) {
        if (t.getProject() == null || t.getProject().getId() == null) {
            throw new IllegalArgumentException("Task project is required");
        }
        requireProjectMember(t.getProject().getId(), actorId);
        Task task = new Task();
        applyTaskChanges(task, t);
        Task saved = taskRepo.save(task);
        updateMilestoneCompletion(saved.getMilestone());
        createActivity(
                actorId,
                "task",
                "Task created",
                actorName(actorId) + " created task \"" + saved.getTitle() + "\" in " + projectName(saved.getProject()),
                taskPath(saved)
        );
        return saved;
    }
    public Task updateTask(Task t, Long actorId) {
        Task existing = taskRepo.findById(t.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        requireProjectMember(existing.getProject().getId(), actorId);
        if (t.getProject() != null && t.getProject().getId() != null) {
            requireProjectMember(t.getProject().getId(), actorId);
        }
        Milestone previousMilestone = existing.getMilestone();
        Task.Status previousStatus = existing.getStatus();
        Task.Priority previousPriority = existing.getPriority();
        LocalDate previousDeadline = existing.getDeadline();
        Long previousAssigneeId = existing.getAssignee() != null ? existing.getAssignee().getId() : null;
        String previousTitle = existing.getTitle();
        applyTaskChanges(existing, t);
        Task saved = taskRepo.save(existing);
        updateMilestoneCompletion(previousMilestone);
        updateMilestoneCompletion(saved.getMilestone());
        createActivity(
                actorId,
                "task",
                "Task updated",
                describeTaskUpdate(saved, previousTitle, previousStatus, previousPriority, previousDeadline, previousAssigneeId, actorId),
                taskPath(saved)
        );
        return saved;
    }
    public void deleteTask(Long id, Long actorId) {
        Task existing = taskRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        requireProjectMember(existing.getProject().getId(), actorId);
        Milestone milestone = existing.getMilestone();
        taskRepo.delete(existing);
        updateMilestoneCompletion(milestone);
    }
    public List<Task> getOverdueTasks(Long actorId) {
        if (actorId == null) {
            return List.of();
        }
        List<Long> memberProjectIds = projectMembershipRepo.findByUserId(actorId).stream()
                .map(ProjectMembership::getProject)
                .filter(Objects::nonNull)
                .map(Project::getId)
                .filter(Objects::nonNull)
                .toList();
        return taskRepo.findByDeadlineBeforeAndStatusNot(LocalDate.now(), Task.Status.DONE).stream()
                .filter(task -> task.getProject() != null && memberProjectIds.contains(task.getProject().getId()))
                .toList();
    }
    public long getCompletedTasksByProject(Long projectId, Long actorId) {
        requireProjectMember(projectId, actorId);
        return taskRepo.findByProjectIdAndStatus(projectId, Task.Status.DONE).size();
    }

    // Comments
    public List<Comment> getComments(Long taskId, Long actorId) {
        Task task = taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        requireProjectMember(task.getProject().getId(), actorId);
        return commentRepo.findByTaskIdOrderByCreatedAtAsc(taskId);
    }
    public Comment createComment(Long taskId, Long userId, String content) {
        Comment c = new Comment();
        c.setContent(content);
        Task task = taskRepo.findById(taskId).orElseThrow();
        requireProjectMember(task.getProject().getId(), userId);
        c.setTask(task);
        c.setUser(userRepo.findById(userId).orElseThrow());
        Comment saved = commentRepo.save(c);
        createActivity(
                userId,
                "comment",
                "Comment added",
                actorName(userId) + " commented on \"" + saved.getTask().getTitle() + "\"",
                taskPath(saved.getTask())
        );
        return saved;
    }

    public List<Notification> getActivities(Long actorId, Integer limit) {
        if (actorId == null) {
            return List.of();
        }
        List<Notification> activities = notificationRepo.findByUserIdOrderByCreatedAtDesc(actorId);
        if (limit == null || limit <= 0 || activities.size() <= limit) {
            return activities;
        }
        return new ArrayList<>(activities.subList(0, limit));
    }

    public Notification recordActivity(Long actorId, String type, String title, String message, String targetPath) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Activity title is required");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Activity message is required");
        }
        return createActivity(
                actorId,
                type != null && !type.isBlank() ? type : "task",
                title,
                message,
                targetPath != null && !targetPath.isBlank() ? targetPath : "/dashboard"
        );
    }

    public void deleteComment(Long taskId, Long commentId, Long userId) {
        Comment comment = commentRepo.findById(commentId)
                .filter(existing -> existing.getTask() != null && existing.getTask().getId().equals(taskId))
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (comment.getUser() == null || !comment.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You can delete only your own comments");
        }
        Task task = comment.getTask();
        if (task == null || task.getProject() == null || task.getProject().getId() == null) {
            throw new IllegalArgumentException("Task not found");
        }
        requireProjectMember(task.getProject().getId(), userId);
        commentRepo.delete(comment);
    }

    public Project requireProjectMember(Long projectId, Long actorId) {
        if (actorId == null) {
            throw new AccessDeniedException("Authentication is required");
        }
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!projectMembershipRepo.existsByProjectIdAndUserId(projectId, actorId)) {
            throw new AccessDeniedException("You are not a member of this project");
        }
        return project;
    }

    public Project requireProjectOwner(Long projectId, Long actorId) {
        Project project = requireProjectMember(projectId, actorId);
        ProjectMembership membership = projectMembershipRepo.findByProjectIdAndUserId(projectId, actorId)
                .orElseThrow(() -> new AccessDeniedException("Project membership not found"));
        if (membership.getRole() != ProjectMembership.Role.OWNER) {
            throw new AccessDeniedException("Only project owner can perform this action");
        }
        return project;
    }

    public List<ProjectMembership> getProjectMembers(Long projectId, Long actorId) {
        requireProjectMember(projectId, actorId);
        return projectMembershipRepo.findByProjectId(projectId);
    }

    public ProjectMembership updateProjectMemberRole(Long projectId, Long memberUserId, ProjectMembership.Role role, Long actorId) {
        requireProjectOwner(projectId, actorId);
        ProjectMembership membership = projectMembershipRepo.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Project membership not found"));
        if (role == ProjectMembership.Role.OWNER && !Objects.equals(memberUserId, actorId)) {
            ProjectMembership actorMembership = projectMembershipRepo.findByProjectIdAndUserId(projectId, actorId)
                    .orElseThrow(() -> new IllegalArgumentException("Owner membership not found"));
            actorMembership.setRole(ProjectMembership.Role.MEMBER);
            projectMembershipRepo.save(actorMembership);
        }
        membership.setRole(role);
        return projectMembershipRepo.save(membership);
    }

    public void removeProjectMember(Long projectId, Long memberUserId, Long actorId) {
        requireProjectOwner(projectId, actorId);
        if (Objects.equals(memberUserId, actorId)) {
            throw new IllegalArgumentException("Owner cannot remove themselves from the project");
        }
        ProjectMembership membership = projectMembershipRepo.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Project membership not found"));
        projectMembershipRepo.delete(membership);
    }

    public ProjectInvite createProjectInvite(Long projectId, Long actorId, Integer expiresInHours, Integer maxUses) {
        Project project = requireProjectOwner(projectId, actorId);
        User actor = userRepo.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ProjectInvite invite = new ProjectInvite();
        invite.setProject(project);
        invite.setCreatedBy(actor);
        invite.setToken(UUID.randomUUID().toString());
        invite.setMaxUses(maxUses != null && maxUses > 0 ? maxUses : 1);
        int ttlHours = expiresInHours != null && expiresInHours > 0 ? expiresInHours : 72;
        invite.setExpiresAt(LocalDateTime.now().plusHours(ttlHours));
        invite.setUsedCount(0);
        invite.setRevoked(false);
        invite.setCreatedAt(LocalDateTime.now());

        return projectInviteRepo.save(invite);
    }

    public List<ProjectInvite> getProjectInvites(Long projectId, Long actorId) {
        requireProjectOwner(projectId, actorId);
        return projectInviteRepo.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public ProjectMembership acceptProjectInvite(String token, Long actorId) {
        if (actorId == null) {
            throw new AccessDeniedException("Authentication is required");
        }
        ProjectInvite invite = projectInviteRepo.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));
        if (invite.isRevoked()) {
            throw new IllegalArgumentException("Invite has been revoked");
        }
        if (invite.isExpired()) {
            throw new IllegalArgumentException("Invite has expired");
        }
        if (invite.isUsageExceeded()) {
            throw new IllegalArgumentException("Invite usage limit reached");
        }

        Optional<ProjectMembership> existingMembership = projectMembershipRepo
                .findByProjectIdAndUserId(invite.getProject().getId(), actorId);
        if (existingMembership.isPresent()) {
            return existingMembership.get();
        }

        User user = userRepo.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ProjectMembership membership = new ProjectMembership();
        membership.setProject(invite.getProject());
        membership.setUser(user);
        membership.setRole(ProjectMembership.Role.MEMBER);
        membership.setJoinedAt(LocalDateTime.now());
        ProjectMembership saved = projectMembershipRepo.save(membership);

        invite.setUsedCount((invite.getUsedCount() == null ? 0 : invite.getUsedCount()) + 1);
        projectInviteRepo.save(invite);

        createActivity(
                actorId,
                "project",
                "Project joined",
                actorName(actorId) + " joined project \"" + invite.getProject().getName() + "\"",
                projectPath(invite.getProject())
        );
        return saved;
    }

    public Map<String, Object> getInviteDetails(String token) {
        ProjectInvite invite = projectInviteRepo.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));
        return Map.of(
                "token", invite.getToken(),
                "expiresAt", invite.getExpiresAt(),
                "revoked", invite.isRevoked(),
                "usedCount", invite.getUsedCount(),
                "maxUses", invite.getMaxUses(),
                "expired", invite.isExpired(),
                "usageExceeded", invite.isUsageExceeded()
        );
    }

    private void applyTaskChanges(Task target, Task source) {
        target.setTitle(source.getTitle());
        target.setDescription(source.getDescription());
        target.setStatus(source.getStatus() != null ? source.getStatus() : Task.Status.BACKLOG);
        target.setPriority(source.getPriority() != null ? source.getPriority() : Task.Priority.MEDIUM);
        target.setDeadline(source.getDeadline());

        if (source.getProject() == null || source.getProject().getId() == null) {
            throw new IllegalArgumentException("Task project is required");
        }
        target.setProject(projectRepo.findById(source.getProject().getId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found")));

        if (source.getAssignee() != null && source.getAssignee().getId() != null) {
            target.setAssignee(userRepo.findById(source.getAssignee().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found")));
        } else {
            target.setAssignee(null);
        }

        if (source.getMilestone() != null && source.getMilestone().getId() != null) {
            Milestone milestone = milestoneRepo.findById(source.getMilestone().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
            if (milestone.getProject() == null || !milestone.getProject().getId().equals(target.getProject().getId())) {
                throw new IllegalArgumentException("Milestone does not belong to the task project");
            }
            target.setMilestone(milestone);
        } else if (target.getId() == null) {
            target.setMilestone(null);
        }
    }

    private void updateMilestoneCompletion(Milestone milestone) {
        if (milestone == null || milestone.getId() == null) {
            return;
        }

        Milestone managedMilestone = milestoneRepo.findById(milestone.getId()).orElse(null);
        if (managedMilestone == null) {
            return;
        }

        List<Task> assignedTasks = taskRepo.findByMilestoneId(managedMilestone.getId());
        managedMilestone.setCompleted(!assignedTasks.isEmpty() &&
                assignedTasks.stream().allMatch(task -> task.getStatus() == Task.Status.DONE));
        milestoneRepo.save(managedMilestone);
    }

    private Notification createActivity(Long actorId, String type, String title, String message, String targetPath) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetPath(targetPath);
        notification.setRead(false);
        if (actorId != null) {
            userRepo.findById(actorId).ifPresent(notification::setUser);
        }
        return notificationRepo.save(notification);
    }

    private String describeTaskUpdate(Task task,
                                      String previousTitle,
                                      Task.Status previousStatus,
                                      Task.Priority previousPriority,
                                      LocalDate previousDeadline,
                                      Long previousAssigneeId,
                                      Long actorId) {
        String actor = actorName(actorId);
        String taskTitle = task.getTitle();
        if (!Objects.equals(previousStatus, task.getStatus())) {
            return actor + " moved \"" + taskTitle + "\" to " + formatLabel(task.getStatus().name());
        }
        Long currentAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;
        if (!Objects.equals(previousAssigneeId, currentAssigneeId)) {
            String assigneeName = task.getAssignee() != null ? task.getAssignee().getName() : "Unassigned";
            return actor + " reassigned \"" + taskTitle + "\" to " + assigneeName;
        }
        if (!Objects.equals(previousDeadline, task.getDeadline())) {
            return actor + " updated the deadline for \"" + taskTitle + "\"";
        }
        if (!Objects.equals(previousPriority, task.getPriority())) {
            return actor + " changed the priority for \"" + taskTitle + "\" to " + formatLabel(task.getPriority().name());
        }
        if (!Objects.equals(previousTitle, task.getTitle())) {
            return actor + " renamed task to \"" + task.getTitle() + "\"";
        }
        return actor + " updated task \"" + taskTitle + "\"";
    }

    private String actorName(Long actorId) {
        if (actorId == null) {
            return "System";
        }
        return userRepo.findById(actorId).map(User::getName).orElse("System");
    }

    private String projectName(Project project) {
        return project != null ? project.getName() : "Unknown project";
    }

    private String projectPath(Project project) {
        return project != null && project.getId() != null ? "/projects/" + project.getId() : "/projects";
    }

    private String taskPath(Task task) {
        if (task.getProject() != null && task.getProject().getId() != null) {
            return "/projects/" + task.getProject().getId();
        }
        return "/projects";
    }

    private String formatLabel(String value) {
        return value.toLowerCase().replace('_', ' ');
    }
}
