export interface RawProjectData {
    "Current Status": string | null
    "Tender Ref. No. / NIT & Date": string | null
    "EMD/tender fee Online /Exempted as per MSME bidder": string | null
    "EMD /online payment received status": string | null
    "HR required data for HR clearance RA bill realeased": string | null
    "Policy Expired dt./renewal if any": string | null
    "Labour License No./date of reg. & expired dt. /BOCW if any": string | null
    "Status of PF/ESIC pending amount for HR clearance Running bills": string | null
    "Job Allocation No. (JAN)": number | null
    "EIC at Aakar": string | null
    "Client Name": string | null
    "State": string | null
    "Place / City": string | null
    "Name of Work": string | null
    "PO/WO/LOA Details": string | null
    "Financial Year": string | null
    "PO/WO/LOA Date": string | null
    "Work Start Date": string | null
    "Completion Date as per LOA/PO": string | null
    "Latest Work Completion Date (as per Time Extension)": string | null
    "Completion Date as per Finla Time Extension / Deviation": string | null
    "Client Billing Address": string | null
    "Name of Authorised Person At Client": string | null
    "Designation of Authorised Person At Client": string | null
    "Mobile No. of Authorised Person At Client": string | number | null
    "Email of Authorised Person At Client": string | null
    "Email CC (Client)/C&M": string | null
    "Contract Value Version as per LOI/NOA/LOA/DLOA/PO GST Extra": number | string | null
    "GST Extra /Including": string | null
    "Updated Contract Value GST Extra": number | string | null
    "Bank Guarantee Submitted / CPG Not Submitted": string | number | null
    "Bank Guarantee Value": number | string | null
    "Bank Guaratee Expiry Date": string | null
    "Bank Guaratee Expiry Date (Claim)": string | null
    "Client WO/PO Upload LINK": string | null
    "Client contract agreement LINK": string | null
    "1st Sub Contractor's Name": string | null
    "Proprietor / Auth. Signatory of Sub-Cont.": string | null
    "Mobile No. of Sub-Cont. Proprietor / Auth. Signatory's": string | number | null
    "Email of Sub-Cont. Proprietor / Auth. Signatory's": string | null
    "GSTIN of Sub Contractor": string | null
    "WO on % Party": number | string | null
    "Work Order No.": number | string | null
    "Work Order Date": string | null
    "Sub-Contractor Work Order (Upload)": string | null
}

export interface Project {
    jan: number
    clientName: string
    location: {
        state: string
        city: string
    }
    workName: string
    status: string
    financialYear: string
    dates: {
        tinderDate: string
        loaDate: string
        startDate: string
        completionDateOriginal: string
        completionDateLatest: string
    }
    contract: {
        valueInternal: number
        valueUpdated: number
        gstTerms: string
    }
    clientContact: {
        name: string
        designation: string
        mobile: string
        email: string
        billingAddress: string
        emailCC: string
    }
    bankGuarantee: {
        status: string
        value: number
        expiryDate: string
        claimDate: string
    }
    compliance: {
        emdStatus: string
        emdPaymentStatus: string
        hrClearance: string
        policyExpiry: string
        laborLicense: string
        pfEsicStatus: string
    }
    extra: {
        eicName: string
        poDetails: string
        completionDateFinal: string
    }
    subcontractor: {
        name: string
        proprietor: string
        mobile: string
        email: string
        gstin: string
        workOrderNo: string
        workOrderDate: string
        workOrderPercent: string
    }
    documents: {
        loaLink: string
        agreementLink: string
        subWorkOrderLink: string
    }
}
