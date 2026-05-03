"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  Send,
  LoaderCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import emailjs from "@emailjs/browser";

const contactRecipient =
  process.env.NEXT_PUBLIC_CONTACT_TO_EMAIL ?? "spam.alee.abd@gmail.com";
const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const emailjsTemplateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

const Contact = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    message: "",
  });

  const [focused, setFocused] = useState({
    username: false,
    email: false,
    message: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const contactInfo = [
    {
      icon: <Mail size={24} className="text-rose-200" />,
      title: "Email",
      value: "ali.37803990@gmail.com",
      link: "mailto:ali.37803990@gmail.com",
    },
    {
      icon: <Phone size={24} className="text-rose-200" />,
      title: "WhatsApp",
      value: "+92-321-4614610",
      link: "https://wa.me/923214614610",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFocus = (field: keyof typeof focused) => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof typeof focused) => {
    if (formData[field as keyof typeof formData] === "") {
      setFocused((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
        throw new Error("Missing EmailJS environment variables");
      }

      await emailjs.send(
        emailjsServiceId,
        emailjsTemplateId,
        {
          to_email: contactRecipient,
          from_name: formData.username,
          from_email: formData.email,
          reply_to: formData.email,
          message: formData.message,
        },
        {
          publicKey: emailjsPublicKey,
        }
      );

      setSubmitStatus("success");
      setFormData({ username: "", email: "", message: "" });
      setFocused({ username: false, email: false, message: false });
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  return (
    <section className="py-24 " id="contact">
      <div className="container mx-auto px-6">
        <div className="relative mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-100">Contact Me</h2>
          <p className="text-center text-rose-500 mt-2">Get in Touch</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">
                Let's work together
              </h3>
              <p className="text-gray-400">
                I'm currently available for freelance work and full-time
                positions. Feel free to reach out through any platform below.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group rounded-xl border border-white/15 bg-gradient-to-br from-rose-200/10 via-pink-200/[0.06] to-slate-100/[0.04] p-6 shadow-[0_16px_44px_-32px_rgba(244,114,182,0.75)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-rose-200/25 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-rose-200/20 bg-rose-100/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:scale-105">
                    {info.icon}
                  </div>
                  <h3 className="text-md font-semibold text-gray-100 mb-1">
                    {info.title}
                  </h3>
                  <span className="text-sm text-gray-400 block mb-3 truncate">
                    {info.value}
                  </span>
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-sm font-medium text-rose-200 transition-colors duration-300 hover:border-rose-200/30 hover:bg-rose-100/10 hover:text-white"
                  >
                    Connect
                    <i className="uil uil-arrow-right transform transition-transform duration-300 group-hover/link:translate-x-1"></i>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form Side */}
          <motion.form
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-white/15 bg-gradient-to-br from-rose-200/[0.08] via-pink-200/[0.05] to-slate-100/[0.035] p-8 shadow-[0_18px_50px_-34px_rgba(244,114,182,0.8)] backdrop-blur-xl"
          >
            <div className={`relative`}>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-gray-100 outline-none transition-all duration-300 focus:border-rose-300/70 focus:bg-rose-50/[0.04]"
                onFocus={() => handleFocus("username")}
                onBlur={() => handleBlur("username")}
                required
              />
              <label
                className={`absolute left-4 px-1 text-gray-400 pointer-events-none transition-all duration-300 ${focused.username || formData.username
                    ? "-top-2.5 bg-[hsl(242,19%,5%)] text-xs text-rose-300"
                    : "top-3.5"
                  }`}
              >
                Your Name
              </label>
            </div>

            <div className={`relative`}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-gray-100 outline-none transition-all duration-300 focus:border-rose-300/70 focus:bg-rose-50/[0.04]"
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
                required
              />
              <label
                className={`absolute left-4 px-1 text-gray-400 pointer-events-none transition-all duration-300 ${focused.email || formData.email
                    ? "-top-2.5 bg-[hsl(242,19%,5%)] text-xs text-rose-300"
                    : "top-3.5"
                  }`}
              >
                Your Email
              </label>
            </div>

            <div className={`relative`}>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="min-h-[140px] w-full resize-none rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-gray-100 outline-none transition-all duration-300 focus:border-rose-300/70 focus:bg-rose-50/[0.04]"
                onFocus={() => handleFocus("message")}
                onBlur={() => handleBlur("message")}
                required
              ></textarea>
              <label
                className={`absolute left-4 px-1 text-gray-400 pointer-events-none transition-all duration-300 ${focused.message || formData.message
                    ? "-top-2.5 bg-[hsl(242,19%,5%)] text-xs text-rose-300"
                    : "top-3.5"
                  }`}
              >
                Your Message
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200/20 bg-gradient-to-r from-rose-500/90 to-pink-500/80 px-6 py-3 font-medium text-white shadow-[0_16px_34px_-24px_rgba(244,63,94,0.9)] transition-all duration-300 hover:border-rose-100/30 hover:from-rose-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>

            {submitStatus === "success" && (
              <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Message sent successfully! I'll get back to you soon.
              </div>
            )}
            {submitStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
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
