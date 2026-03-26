package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.List;

@Data
public class ApplicationReviewRequest {
    /** Merchant ID to review */
    private Long merchantId;

    /** Target status: UNDER_REVIEW, APPROVED, REJECTED, NEED_MORE_INFO */
    @NotBlank(message = "action is required")
    @Pattern(regexp = "UNDER_REVIEW|APPROVED|REJECTED|NEED_MORE_INFO",
             message = "action must be UNDER_REVIEW, APPROVED, REJECTED, or NEED_MORE_INFO")
    private String action;

    /** Reason for rejection (required when action=REJECTED) */
    private String rejectReason;

    /** Items to supplement (required when action=NEED_MORE_INFO) */
    private List<String> needInfoDetails;

    /** Reviewer remark (shown in timeline) */
    private String remark;

    /** Reviewer name (e.g. "Emily Zhang") */
    private String reviewer;
}
