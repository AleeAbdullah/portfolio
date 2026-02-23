"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Phone,
  Linkedin,
  Github,
  Send,
  LoaderCircle,
  CheckCircle,
  AlertTriangle,
  Upload,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { contactSchema, roles, budgets, type ContactFormData } from "../lib/contactSchema";
import { cn } from "../lib/utils";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      role: undefined,
      budget: undefined,
    },
  });

  const roleOther = watch("roleOther");
  const attachment = watch("attachment");

  const contactInfo = [
    {
      icon: <Mail size={28} className="text-blue-500" />,
      title: "Email",
      value: "ali.37803990@gmail.com",
      link: "mailto:ali.37803990@gmail.com",
    },
    {
      icon: <Phone size={28} className="text-green-500" />,
      title: "WhatsApp",
      value: "+92-321-4614610",
      link: "https://wa.me/923214614610",
    },
    {
      icon: <Linkedin size={28} className="text-blue-600" />,
      title: "LinkedIn",
      value: "Connect on LinkedIn",
      link: "https://www.linkedin.com/in/ali-abdullah-854716224/",
    },
    {
      icon: <Github size={28} className="text-gray-100" />,
      title: "GitHub",
      value: "View Projects",
      link: "https://github.com/ali-abdullah1",
    },
  ];

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const serviceId = "service_64run2q";
    const templateId = "template_a68ku27";
    const publicKey = "KY4oh0khX6r6-kYxL";

    // Create form data for EmailJS
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("companyName", data.companyName || "");
    formData.append("email", data.email);
    formData.append("phoneNumber", data.phoneNumber || "");
    formData.append("role", data.role);
    formData.append("roleOther", data.roleOther || "");
    formData.append("projectDescription", data.projectDescription);
    formData.append("budget", data.budget);
    if (data.attachment && data.attachment instanceof File) {
      formData.append("attachment", data.attachment);
    }

    try {
      await emailjs.sendForm(serviceId, templateId, formData as any, publicKey);
      setSubmitStatus("success");
      reset();
      setSelectedRole("");
      setSelectedBudget("");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (error) {
      console.error("EmailJS error:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={cn("py-24 transition-colors duration-300", "bg-background")} id="contact">
      <div className="container mx-auto px-6">
        <motion.div
          className="relative mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          viewport={{ once: true }}
        >
          <h2 className={cn("text-4xl font-bold transition-colors duration-300", "text-foreground")}>Contact Me</h2>
          <p className={cn("text-center mt-2 transition-colors duration-300", "text-primary")}>Get in Touch</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Side - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="mb-8">
              <h3 className={cn("text-2xl font-semibold mb-2 transition-colors duration-300", "text-foreground")}>
                Let's Discuss Your Next Project!
              </h3>
              <p className={cn("transition-colors duration-300", "text-muted-foreground")}>
                I'm currently available for freelance work and full-time positions. Feel free to reach out through any platform below or fill out the form to discuss your project.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
                  viewport={{ once: true }}
                  className={cn("group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1", "bg-card border border-border hover:border-primary/50 hover:shadow-lg")}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="mb-3 transition-transform duration-300 group-hover:scale-110">
                    {info.icon}
                  </div>
                  <h3 className={cn("text-md font-semibold mb-1 transition-colors duration-300", "text-card-foreground")}>
                    {info.title}
                  </h3>
                  <span className={cn("text-sm block mb-3 truncate transition-colors duration-300", "text-muted-foreground")}>
                    {info.value}
                  </span>
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("inline-flex items-center gap-2 transition-colors duration-300 text-sm font-medium group/link", "text-primary hover:opacity-80")}
                  >
                    Connect
                    <i className="uil uil-arrow-right transform transition-transform duration-300 group-hover/link:translate-x-1"></i>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.form
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            viewport={{ once: true }}
            onSubmit={handleSubmit(onSubmit)}
            className={cn("space-y-6 p-8 rounded-xl transition-colors duration-300", "bg-card border border-border")}
          >
            {/* Contact Information */}
            <div>
              <h4 className={cn("text-lg font-semibold mb-4", "text-foreground")}>Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <input
                    type="text"
                    {...register("firstName")}
                    className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary", errors.firstName && "border-destructive")}
                    placeholder="First Name *"
                  />
                  {errors.firstName && (
                    <p className={cn("text-xs mt-1", "text-destructive")}>{errors.firstName.message}</p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    {...register("lastName")}
                    className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary", errors.lastName && "border-destructive")}
                    placeholder="Last Name *"
                  />
                  {errors.lastName && (
                    <p className={cn("text-xs mt-1", "text-destructive")}>{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <input
                    type="text"
                    {...register("companyName")}
                    className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary")}
                    placeholder="Company Name"
                  />
                </div>
                <div className="relative">
                  <input
                    type="email"
                    {...register("email")}
                    className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary", errors.email && "border-destructive")}
                    placeholder="Email *"
                  />
                  {errors.email && (
                    <p className={cn("text-xs mt-1", "text-destructive")}>{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  {...register("phoneNumber")}
                  className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary")}
                  placeholder="Phone Number"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className={cn("block text-sm font-medium mb-3", "text-foreground")}>I'm a/an *</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setValue("role", role as any);
                      if (role !== "Others") {
                        setValue("roleOther", "");
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      selectedRole === role
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {selectedRole === "Others" && (
                <div className="mt-4">
                  <input
                    type="text"
                    {...register("roleOther")}
                    className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary")}
                    placeholder="Please specify"
                  />
                </div>
              )}
              {errors.role && (
                <p className={cn("text-xs mt-1", "text-destructive")}>{errors.role.message}</p>
              )}
            </div>

            {/* Project Description */}
            <div>
              <label className={cn("block text-sm font-medium mb-3", "text-foreground")}>
                Describe your project goal in few sentences *
              </label>
              <textarea
                {...register("projectDescription")}
                rows={4}
                className={cn("w-full border-2 bg-transparent py-3 px-4 rounded-lg outline-none transition-all duration-300 resize-none placeholder:text-muted-foreground", "border-input text-foreground focus:border-primary", errors.projectDescription && "border-destructive")}
                placeholder="Tell me about your project..."
              />
              {errors.projectDescription && (
                <p className={cn("text-xs mt-1", "text-destructive")}>{errors.projectDescription.message}</p>
              )}
            </div>

            {/* Attachment */}
            <div>
              <label className={cn("block text-sm font-medium mb-3", "text-foreground")}>Attachment</label>
              <label
                htmlFor="attachment"
                className={cn("flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 border-2 border-dashed", "border-input hover:border-primary text-muted-foreground hover:text-primary")}
              >
                <Upload size={20} />
                <span>Attach Document</span>
                <input
                  type="file"
                  id="attachment"
                  {...register("attachment")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue("attachment", file);
                    }
                  }}
                />
              </label>
              {attachment && attachment instanceof File && (
                <p className={cn("text-xs mt-2", "text-muted-foreground")}>{attachment.name}</p>
              )}
            </div>

            {/* Budget Selection */}
            <div>
              <label className={cn("block text-sm font-medium mb-3", "text-foreground")}>My Budget *</label>
              <div className="flex flex-wrap gap-2">
                {budgets.map((budget) => (
                  <button
                    key={budget}
                    type="button"
                    onClick={() => {
                      setSelectedBudget(budget);
                      setValue("budget", budget as any);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      selectedBudget === budget
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    )}
                  >
                    {budget}
                  </button>
                ))}
              </div>
              {errors.budget && (
                <p className={cn("text-xs mt-1", "text-destructive")}>{errors.budget.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className={cn("w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", "bg-primary text-primary-foreground hover:opacity-90")}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit
                </>
              )}
            </motion.button>

            {/* Status Messages */}
            {submitStatus === "success" && (
              <div className={cn("border px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center gap-2", "bg-green-500/10 border-green-500 text-green-400")}>
                <CheckCircle size={18} />
                Message sent successfully! I'll get back to you soon.
              </div>
            )}
            {submitStatus === "error" && (
              <div className={cn("border px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center gap-2", "bg-red-500/10 border-red-500 text-red-400")}>
                <AlertTriangle size={18} />
                Something went wrong. Please try again.
              </div>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
