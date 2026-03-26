package com.osl.pay.portal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.osl.pay.portal.model.entity.Notification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {
}
