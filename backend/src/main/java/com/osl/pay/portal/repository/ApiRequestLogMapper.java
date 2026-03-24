package com.osl.pay.portal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.osl.pay.portal.model.entity.ApiRequestLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ApiRequestLogMapper extends BaseMapper<ApiRequestLog> {
}
