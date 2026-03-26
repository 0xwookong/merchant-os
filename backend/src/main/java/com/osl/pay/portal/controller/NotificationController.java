package com.osl.pay.portal.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.entity.Notification;
import com.osl.pay.portal.repository.NotificationMapper;
import com.osl.pay.portal.security.AuthUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationMapper notificationMapper;

    /**
     * Get recent notifications for the current user.
     * Returns notifications targeted to this user OR to all users in the merchant.
     */
    @GetMapping
    public Result<Map<String, Object>> list(@AuthenticationPrincipal AuthUserDetails user) {
        List<Notification> notifications = notificationMapper.selectList(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getMerchantId, user.getMerchantId())
                        .and(w -> w.isNull(Notification::getUserId)
                                .or().eq(Notification::getUserId, user.getUserId()))
                        .orderByDesc(Notification::getCreatedAt)
                        .last("LIMIT 50"));

        long unreadCount = notifications.stream().filter(n -> !Boolean.TRUE.equals(n.getIsRead())).count();

        return Result.ok(Map.of(
                "notifications", notifications,
                "unreadCount", unreadCount
        ));
    }

    /**
     * Mark notifications as read.
     * Pass { "ids": [1,2,3] } to mark specific ones, or { "all": true } to mark all.
     */
    @PutMapping("/read")
    public Result<Void> markRead(
            @AuthenticationPrincipal AuthUserDetails user,
            @RequestBody Map<String, Object> body) {

        boolean markAll = Boolean.TRUE.equals(body.get("all"));

        if (markAll) {
            notificationMapper.update(new LambdaUpdateWrapper<Notification>()
                    .eq(Notification::getMerchantId, user.getMerchantId())
                    .and(w -> w.isNull(Notification::getUserId)
                            .or().eq(Notification::getUserId, user.getUserId()))
                    .eq(Notification::getIsRead, false)
                    .set(Notification::getIsRead, true));
        } else {
            @SuppressWarnings("unchecked")
            List<Number> ids = (List<Number>) body.get("ids");
            if (ids != null && !ids.isEmpty()) {
                List<Long> longIds = ids.stream().map(Number::longValue).toList();
                notificationMapper.update(new LambdaUpdateWrapper<Notification>()
                        .in(Notification::getId, longIds)
                        .eq(Notification::getMerchantId, user.getMerchantId())
                        .set(Notification::getIsRead, true));
            }
        }

        return Result.ok(null);
    }
}
