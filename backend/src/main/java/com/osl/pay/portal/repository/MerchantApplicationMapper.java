package com.osl.pay.portal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.osl.pay.portal.model.entity.MerchantApplication;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MerchantApplicationMapper extends BaseMapper<MerchantApplication> {

    /**
     * 只查 status 字段，完全绕过 autoResultMap 和 JSON TypeHandler。
     * 用于高频轻量查询（sidebar、banner、progress API）。
     */
    @Select("SELECT status FROM t_merchant_application WHERE merchant_id = #{merchantId} ORDER BY id DESC LIMIT 1")
    String selectStatusByMerchantId(@Param("merchantId") Long merchantId);
}
