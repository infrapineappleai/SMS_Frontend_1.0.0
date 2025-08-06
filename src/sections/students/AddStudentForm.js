import React, { useState, useEffect, useMemo } from "react";
import Stepper from "./StudentFormStepper/StudentFormStepper";
import Step1PersonalInfo from "./StudentFormStepper/Step1PersonalInfo";
import Step2ContactDetails from "./StudentFormStepper/Step2ContactDetails";
import Step3EducationalRecords from "./StudentFormStepper/Step3EducationalRecords";
import Step4AcademicDetails from "./StudentFormStepper/Step4AcademicDetails";
import Step5Summary from "./StudentFormStepper/Step5Summary";
import "../../Styles/Students-css/AddStudentForm.css";
import closeIcon from "../../assets/icons/Close.png";
import successToastIcon from '../../assets/icons/Success.png';
import { useToast } from "../../modals/ToastProvider";
import {
  createStudentWithOptionalPhoto,
  updateStudent,
  getDropdownOptions,
} from "../../integration/studentAPI";
import NextButton from "../../Components/Buttons/Next_button";
import PreviousButton from "../../Components/Buttons/PreviousButton";
import LongNextButton from "../../Components/Buttons/LongNextButton";

const getInitialFormData = () => ({
  status: "Active",
  salutation: "",
  first_name: "",
  last_name: "",
  name: "",
  date_of_birth: "",
  gender: "",
  phn_num: "",
  ice_contact: "",
  email: "",
  address: "",
  photo_url: "/default-avatar.png",
  previewUrl: null,
  photoFile: null,
  branch: "",
  student_no: "",
  course: "",
  grade: "",
  schedule_day: "",
  schedule_time: "",
  payment: { amount: "", status: "pending" },
  assignedCourses: [],
  schedules: [],
  resetKey: Date.now(), 
});

const AddStudentForm = ({
  isOpen,
  onClose,
  onAddStudent,
  initialData,
  isEditMode,
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const totalSteps = 4;

  const steps = useMemo(
    () => [
      "Personal Information",
      "Contact Details",
      "Educational Records",
      "Academic Details",
    ],
    []
  );

useEffect(() => {
  if (initialData && isOpen) {
    console.log("Initial Data for Edit:", {
      phn_num: initialData.phn_num,
      ice_contact: initialData.ice_contact,
      fullData: initialData
    });
    setFormData({
      ...getInitialFormData(),
      ...initialData,
      name: `${initialData.salutation || ""} ${initialData.first_name || ""} ${
        initialData.last_name || ""
      }`.trim(),
      course: "",
      grade: "",
      phn_num: initialData.phn_num || "",
      ice_contact: initialData.ice_contact || "",
      status: initialData.status
        ? initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1).toLowerCase()
        : "Active", 
      assignedCourses: Array.isArray(initialData.assignedCourses)
        ? initialData.assignedCourses.map((c, index) => ({
            ...c,
            id: c.id || Date.now() + index,
          }))
        : initialData.course
        ? [
            {
              course: initialData.course,
              grade: initialData.grade,
              id: Date.now(),
            },
          ]
        : [],
      schedules: Array.isArray(initialData.schedules)
        ? initialData.schedules.map((s, index) => ({
            id: s.id || Date.now() + index,
            branch: s.branch || initialData.branch || "N/A",
            studentId: s.studentId || s.student_no || initialData.student_no || "N/A",
            day: s.day || s.schedule_day,
            time: s.time || s.schedule_time,
            course: s.course || initialData.course,
            grade: s.grade || initialData.grade,
          }))
        : initialData.schedule_day && initialData.schedule_day !== "Invalid date"
        ? [
            {
              day: initialData.schedule_day,
              time: initialData.schedule_time,
              branch: initialData.branch || "N/A",
              studentId: initialData.student_no || "N/A",
              id: Date.now(),
            },
          ]
        : [],
      photo_url: initialData.photo_url || "/default-avatar.png",
      previewUrl: initialData.photo_url || null,
      resetKey: Date.now(),
    });
    setStep(1);
    setErrors({});
    setShowSummary(false);
  } else if (!isOpen) {
    setFormData(getInitialFormData());
    setStep(1);
    setErrors({});
    setShowSummary(false);
  }
}, [initialData, isOpen]);

  const validateStep = (cur) => {
    const errs = {};
    if (cur === 1) {
      ["salutation", "first_name", "last_name", "date_of_birth", "gender"].forEach(
        (f) => {
          if (!formData[f]) errs[f] = "Required";
        }
      );
    }
    if (cur === 2) {
      ["phn_num", "ice_contact", "email", "address"].forEach((f) => {
        if (!formData[f]) errs[f] = "Required";
      });
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errs.email = "Invalid email format";
      }
    }
    if (cur === 3) {
      if (!formData.assignedCourses?.length)
        errs.assignedCourses = "At least one course is required";
    }
    if (cur === 4) {
      if (!formData.branch) errs.branch = "Branch is required";
      if (!formData.student_no) errs.student_no = "Student ID is required";
      if (!formData.schedules?.length)
        errs.schedules = "At least one schedule is required";
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast({
        title: "Validation Error",
        message: "Please fill all required fields",
        isError: true,
      });
      return;
    }
    setErrors({});
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFormDataChange = (updates) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates };
      if (
        "salutation" in updates ||
        "first_name" in updates ||
        "last_name" in updates
      ) {
        newData.name = `${newData.salutation || ""} ${newData.first_name || ""} ${
          newData.last_name || ""
        }`.trim();
      }
      return newData;
    });
    setErrors((prev) => {
      const updated = { ...prev };
      Object.keys(updates).forEach((k) => delete updated[k]);
      return updated;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFormDataChange({
          photoFile: file,
          previewUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    } else {
      handleFormDataChange({
        photoFile: null,
        previewUrl: null,
        photo_url: "/default-avatar.png",
      });
    }
  };

const handleSubmit = async () => {
  try {
    const errs = validateStep(4);
    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast({
        title: "Validation Error",
        message: "Please ensure all required fields are filled",
        isError: true,
      });
      return;
    }

    if (!formData.student_no || formData.student_no.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        student_no: "Student number is required",
      }));
      showToast({
        title: "Validation Error",
        message: "Student number is required",
        isError: true,
      });
      return;
    }

    const branches = await getDropdownOptions("branches");
    const matchedBranch = branches.find(
      (b) => b.branch_name === formData.branch
    );
    if (!matchedBranch) {
      setErrors((prev) => ({
        ...prev,
        branch: "Invalid branch selected",
      }));
      showToast({
        title: "Validation Error",
        message: "Please select a valid branch",
        isError: true,
      });
      return;
    }

    const courses = await getDropdownOptions("courses");
    const gradeIds = [];
    for (const { course, grade } of formData.assignedCourses || []) {
      const courseId = courses.find((c) => c.name === course)?.id;
      if (!courseId) continue;
      const grades = await getDropdownOptions("grades", { courseId });
      const gradeId = grades.find((g) => g.grade_name === grade)?.id;
      if (gradeId) gradeIds.push(gradeId);
    }

    if (!gradeIds.length && formData.assignedCourses?.length) {
      setErrors((prev) => ({
        ...prev,
        assignedCourses: "No valid grades found for selected courses",
      }));
      showToast({
        title: "Validation Error",
        message: "Please select valid courses and grades",
        isError: true,
      });
      return;
    }

    const slotIds = (formData.schedules || [])
      .map((s) => s.id)
      .filter(Boolean);
    if (!slotIds.length && formData.schedules?.length) {
      setErrors((prev) => ({
        ...prev,
        schedules: "No valid schedules selected",
      }));
      showToast({
        title: "Validation Error",
        message: "Please select at least one valid schedule",
        isError: true,
      });
      return;
    }

const payload = new FormData();
payload.append(
  "user",
  JSON.stringify({
    name: formData.name,
    first_name: formData.first_name,
    last_name: formData.last_name,
    username: formData.username || formData.last_name,
    password: formData.password || "defaultpassword",
    email: formData.email,
    phn_num: formData.phn_num,
    gender: formData.gender,
    date_of_birth: new Date(formData.date_of_birth)
      .toISOString()
      .split("T")[0],
    address: formData.address,
    role: "student",
    status: formData.status.toLowerCase(),  
  })
);
    payload.append(
      "student_details",
      JSON.stringify({
        student_no: formData.student_no.trim(),
        salutation: formData.salutation || "",
        ice_contact: formData.ice_contact || formData.phn_num || "",
      })
    );
    payload.append("grade_ids", JSON.stringify(gradeIds));
    payload.append("slot_ids", JSON.stringify(slotIds));
    payload.append("branch_ids", JSON.stringify([matchedBranch.id]));
    if (formData.photoFile instanceof File) {
      payload.append("photo", formData.photoFile);
    }

    console.log("AddStudentForm: Payload entries:", [...payload]);

    let studentData;
    if (isEditMode && (initialData?.id || initialData?.user_id)) {
      const studentId = initialData.id || initialData.user_id;
      const result = await updateStudent(studentId, payload);
      studentData = {
        id: studentId,
        ...result,
        name: result.name || `${formData.salutation || ""} ${formData.first_name} ${formData.last_name}`.trim(),
        first_name: result.first_name || formData.first_name,
        last_name: result.last_name || formData.last_name,
        course: result.course || formData.assignedCourses?.[0]?.course || formData.course || "N/A",
        status: result.status || formData.status || "Active",
        photo_url: result.photo_url || formData.photo_url,
        phn_num: result.phn_num || formData.phn_num,
        ice_contact: result.ice_contact || formData.ice_contact,
        email: result.email || formData.email,
        address: result.address || formData.address,
        date_of_birth: result.date_of_birth || formData.date_of_birth,
        gender: result.gender || formData.gender,
        branch: result.branch || formData.branch,
        student_no: result.student_no || formData.student_no,
        assignedCourses: result.assignedCourses || formData.assignedCourses || [],
        schedules: result.schedules || formData.schedules || [],
        payment: result.payment || formData.payment || { amount: "", status: "pending" },
      };
      setFormData((prev) => ({
        ...prev,
        photo_url: result.photo_url || prev.photo_url,
        previewUrl: result.photo_url || prev.previewUrl,
      }));
      await onAddStudent(studentData);
    } else {
      const result = await createStudentWithOptionalPhoto(payload);
      console.log("createStudentWithOptionalPhoto result:", result);
      studentData = {
        id: result.id || result.user_id || Date.now(),  
        ...result,
        name: result.name || `${formData.salutation || ""} ${formData.first_name} ${formData.last_name}`.trim(),
        first_name: result.first_name || formData.first_name,
        last_name: result.last_name || formData.last_name,
        course: result.course || formData.assignedCourses?.[0]?.course || formData.course || "N/A",
        status: result.status || formData.status || "Active",
        photo_url: result.photo_url || formData.photo_url || "/default-avatar.png",
        phn_num: result.phn_num || formData.phn_num,
        ice_contact: result.ice_contact || formData.ice_contact,
        email: result.email || formData.email,
        address: result.address || formData.address,
        date_of_birth: result.date_of_birth || formData.date_of_birth,
        gender: result.gender || formData.gender,
        branch: result.branch || formData.branch,
        student_no: result.student_no || formData.student_no,
        assignedCourses: result.assignedCourses || formData.assignedCourses || [],
        schedules: result.schedules || formData.schedules || [],
        payment: result.payment || formData.payment || { amount: "", status: "pending" },
      };
      await onAddStudent(studentData);
    }

    showToast({
      title: "Success",
      message: isEditMode ? "Student updated successfully!" : "Student created successfully!",
      icon: successToastIcon
    });
    setShowSummary(false);
    setFormData({ ...getInitialFormData(), resetKey: Date.now() });
    setStep(1);
    onClose();
  } catch (error) {
    console.error("AddStudentForm: Submit error:", error);
    showToast({
      title: "Error",
      message: `Failed to save student: ${error.message || "Unknown error"}`,
      isError: true,
    });
  }
};


  if (!isOpen) return null;

  return (
    <>
      {!showSummary && (
        <div className="student-modal-overlay">
          <div className="student-modal">
            <div className="modal-header">
              <h2 className="popup-header">
                {initialData ? "Edit Student" : "Student Registration"}
              </h2>
              <img
                src={closeIcon}
                alt="close"
                className="close-icon"
                onClick={() => {
                  setFormData({ ...getInitialFormData(), resetKey: Date.now() });
                  setStep(1);
                  setErrors({});
                  setShowSummary(false);
                  onClose();
                }}
              />
            </div>
            <div className="stepper-wrapper-unique">
              <Stepper steps={steps} currentStep={step} />
            </div>
            <div className="modal-content-wrapper">
              {step === 1 && (
                <Step1PersonalInfo
                  key={formData.resetKey} // Force re-mount to clear file input
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                  onImageChange={handleImageChange}
                />
              )}
              {step === 2 && (
                <Step2ContactDetails
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                />
              )}
              {step === 3 && (
                <Step3EducationalRecords
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                />
              )}
              {step === 4 && (
                <Step4AcademicDetails
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                />
              )}
            </div>
            <div
              className={`modal-actions ${
                step === 1 ? "long-next-layout" : "standard-buttons"
              }`}
            >
              {step === 1 ? (
                <LongNextButton onClick={handleNext} />
              ) : (
                <>
                  <PreviousButton onClick={handleBack} />
                  <NextButton onClick={handleNext} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showSummary && (
        <Step5Summary
          isOpen={showSummary}
          studentData={formData}
          onClose={() => {
            setShowSummary(false);
            setFormData({ ...getInitialFormData(), resetKey: Date.now() });
            setStep(1);
            onClose();
          }}
          onSave={handleSubmit}
          onEdit={() => {
            setShowSummary(false);
            setStep(1);
          }}
        />
      )}
    </>
  );
};

export default AddStudentForm;