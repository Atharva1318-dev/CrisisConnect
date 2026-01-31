import React, { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react'

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    type: 'general'
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Form submitted:', formData)
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        type: 'general'
      })

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Get in Touch
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Have questions about CrisisAlert? We're here to help. Contact our team for support, partnerships, or inquiries.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          
          {/* Email Card */}
          <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition mb-4">
              <Mail className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600 mb-4">Reach out to our support team</p>
            <div className="space-y-2">
              <p className="text-blue-600 font-semibold hover:text-blue-700 transition">
                <a href="mailto:support@crisisalert.com">support@crisisalert.com</a>
              </p>
              <p className="text-gray-500 text-sm">Response time: &lt;2 hours</p>
            </div>
          </div>

          {/* Phone Card */}
          <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition mb-4">
              <Phone className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600 mb-4">Call us for immediate assistance</p>
            <div className="space-y-2">
              <p className="text-blue-600 font-semibold hover:text-blue-700 transition">
                <a href="tel:+1-800-CRISIS-1">+1-800-CRISIS-1</a>
              </p>
              <p className="text-gray-500 text-sm">Available 24/7</p>
            </div>
          </div>

          {/* Location Card */}
          <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition mb-4">
              <MapPin className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600 mb-4">Visit our headquarters</p>
            <div className="space-y-2">
              <p className="text-gray-900 font-semibold">123 Emergency Street</p>
              <p className="text-gray-600 text-sm">Mumbai, India 400001</p>
            </div>
          </div>
        </div>

        {/* Main Contact Form Section */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
            <p className="text-gray-600 mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

            {submitted && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Message sent successfully!</p>
                  <p className="text-green-700 text-sm">Thank you for contacting us. We'll respond shortly.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">
                  Inquiry Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Support Request</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows="5"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* FAQ / Info Section */}
          <div className="space-y-6">
            {/* Quick Response */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Quick Response</h3>
                  <p className="text-gray-600 text-sm">
                    Our support team typically responds within 2 hours during business hours and 24 hours on weekends.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Frequently Asked</h3>
              
              <details className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  How do I report an emergency?
                  <span className="transition group-open:rotate-180">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <p className="text-gray-600 text-sm mt-3">
                  You can report an emergency by calling our 24/7 hotline or using the mobile app to submit voice/image reports with automatic location detection.
                </p>
              </details>

              <details className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  Is my data secure?
                  <span className="transition group-open:rotate-180">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <p className="text-gray-600 text-sm mt-3">
                  Yes, we use end-to-end encryption and comply with all data protection regulations. Your privacy is our priority.
                </p>
              </details>

              <details className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  How can agencies integrate CrisisAlert?
                  <span className="transition group-open:rotate-180">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <p className="text-gray-600 text-sm mt-3">
                  Contact our partnership team at partnerships@crisisalert.com for custom integration solutions and training.
                </p>
              </details>

              <details className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  What languages are supported?
                  <span className="transition group-open:rotate-180">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <p className="text-gray-600 text-sm mt-3">
                  CrisisAlert supports 15+ languages including English, Hindi, Spanish, French, and more. Regional language support is being added.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="mt-20 bg-blue-600 text-white rounded-2xl mx-4 sm:mx-6 lg:mx-8 p-12 text-center max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-4">Emergency Support Available 24/7</h2>
        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
          Need immediate assistance? Our emergency support team is always available to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <a
            href="tel:+1-800-CRISIS-1"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Call Now: +1-800-CRISIS-1
          </a>
          <a
            href="mailto:emergency@crisisalert.com"
            className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
          >
            Email Emergency Team
          </a>
        </div>
      </section>
    </div>
  )
}

export default ContactUs