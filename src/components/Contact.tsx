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

    // --- EmailJS Integration ---
    // 1. Go to https://www.emailjs.com/ and create a free account.
    // 2. Add a new service (e.g., Gmail).
    // 3. Create a new email template. You can use variables like {{username}}, {{email}}, {{message}}.
    // 4. Find your Service ID, Template ID, and Public Key in your account settings.
    // 5. Replace the placeholder values below.

    const serviceId = "service_64run2q"; // Replace with your EmailJS Service ID
    const templateId = "template_a68ku27"; // Replace with your EmailJS Template ID
    const publicKey = "KY4oh0khX6r6-kYxL"; // Replace with your EmailJS Public Key

    emailjs
      .sendForm(serviceId, templateId, e.currentTarget, publicKey)
      .then(
        (result) => {
          console.log("SUCCESS!", result.text);
          setSubmitStatus("success");
          setFormData({ username: "", email: "", message: "" });
          setFocused({ username: false, email: false, message: false });
        },
        (error) => {
          console.log("FAILED...", error.text);
          setSubmitStatus("error");
        }
      )
      .finally(() => {
        setIsSubmitting(false);
        setTimeout(() => setSubmitStatus("idle"), 5000);
      });
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
                  className="group bg-gray-900 p-6 rounded-xl transition-all duration-300 hover:bg-gray-800 hover:-translate-y-1"
                >
                  <div className="mb-3 transition-transform duration-300 group-hover:scale-110">
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
                    className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors duration-300 text-sm font-medium group/link"
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
            className="space-y-6 bg-gray-900 p-8 rounded-xl"
          >
            <div className={`relative`}>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-700 bg-transparent py-3 px-4 text-gray-100 rounded-lg outline-none transition-all duration-300 focus:border-rose-600"
                onFocus={() => handleFocus("username")}
                onBlur={() => handleBlur("username")}
                required
              />
              <label
                className={`absolute left-4 px-1 text-gray-400 pointer-events-none transition-all duration-300 ${focused.username || formData.username
                    ? "-top-2.5 text-xs bg-gray-900 text-rose-500"
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
                className="w-full border-2 border-gray-700 bg-transparent py-3 px-4 text-gray-100 rounded-lg outline-none transition-all duration-300 focus:border-rose-600"
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
                required
              />
              <label
                className={`absolute left-4 px-1 text-gray-400 pointer-events-none transition-all duration-300 ${focused.email || formData.email
                    ? "-top-2.5 text-xs bg-gray-900 text-rose-500"
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
                className="w-full border-2 border-gray-700 bg-transparent py-3 px-4 text-gray-100 rounded-lg outline-none transition-all duration-300 focus:border-rose-600 min-h-[140px] resize-none"
                onFocus={() => handleFocus("message")}
                onBlur={() => handleBlur("message")}
                required
              ></textarea>
              <label
                className={`absolute left-4 px-1 text-gray-400 pointer-events-none transition-all duration-300 ${focused.message || formData.message
                    ? "-top-2.5 text-xs bg-gray-900 text-rose-500"
                    : "top-3.5"
                  }`}
              >
                Your Message
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
