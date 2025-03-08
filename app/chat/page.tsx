"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, X, RefreshCw } from "lucide-react"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [hasUserSentFirstMessage, setHasUserSentFirstMessage] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>("00:00")
  const [isChatEnded, setIsChatEnded] = useState(false)
  const [showOptions, setShowOptions] = useState(true)
  const [currentStep, setCurrentStep] = useState<
    | "initial"
    | "eligibility_board"
    | "state_board_inquiry"
    | "eligibility_subjects"
    | "eligibility_courses"
    | "explore_colleges"
  >("initial")

  // Add viewport meta tag to prevent zooming on mobile
  useEffect(() => {
    const meta = document.createElement("meta")
    meta.name = "viewport"
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    document.getElementsByTagName("head")[0].appendChild(meta)
  }, [])

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-message",
          role: "assistant",
          content: "Welcome to DU Desk AI Chat Assistant! How can I assist you today? Here are some options:",
        },
      ])
      setStartTime(Date.now())
    }
  }, [messages.length, setMessages])

  useEffect(() => {
    setIsTyping(isLoading)
  }, [isLoading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.some((m) => m.role === "user")) {
      setHasUserSentFirstMessage(true)
    }
  }, [messages])

  useEffect(() => {
    if (startTime && !isChatEnded) {
      const interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - startTime
        const minutes = Math.floor(elapsed / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        setElapsedTime(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [startTime, isChatEnded])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && input.trim() !== "" && !isChatEnded) {
      handleSubmit(event)
    }
  }

  const sanitizeResponse = (message: string) => {
    return message
      .replace(/cuet_data.csv|links.csv|list.csv/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/analyzed the provided files|based on the `?`? file you provided,/g, "analyzed the relevant information")
      .replace(/\*/g, "")
      .replace(/\n/g, "<br />")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g, // Corrected regex for markdown-style links
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 break-words">$1</a>'
      )
      .replace(/^\s*\*\s/gm, (match, index) => {
        return `<ol class="list-decimal pl-5"><li>` + (index + 1) + "."
      })
      .replace(/\n/gm, "</li>")
      .replace(/-+/gm, "</ol>")
      .replace(/Please note that this list is based on the provided CSV data./g, "")
      .replace(/Good day/g, "Hello")
  }

  const handleOptionClick = (option: string) => {
    if (isChatEnded) return

    if (option === "Check Eligibility") {
      setCurrentStep("eligibility_board")
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: option },
        {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: "From which board have you attempted your 12th exam?",
        },
      ])
    } else if (option === "Explore Colleges") {
      setCurrentStep("explore_colleges")
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: option },
        {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: "Enter the courses to find the colleges that offer them.",
        },
      ])
    }
    setShowOptions(false)
  }

  const handleBoardSelection = (board: string) => {
    if (board === "State Board") {
      setCurrentStep("state_board_inquiry")
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: board },
        {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content:
            "Which state board do you belong to? Please specify your state board (e.g., Maharashtra State Board, Tamil Nadu State Board, etc.).",
        },
      ])
    } else {
      setCurrentStep("eligibility_subjects")
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: board },
        {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: "How many subjects did you study in Class 12? (5 or 6)",
        },
      ])
    }
  }

  const handleEndChat = () => {
    setIsChatEnded(true)
    setMessages([
      ...messages,
      {
        id: "end-chat-message",
        role: "assistant",
        content: `Thank you for using DU Desk AI Chat Assistant! Your chat duration was ${elapsedTime}. Go Back to the Home Page https://dudesk.in`,
      },
    ])
  }

  const handleResetChat = () => {
    setMessages([])
    setIsChatEnded(false)
    setStartTime(Date.now())
    setElapsedTime("00:00")
    setHasUserSentFirstMessage(false)
    setShowOptions(true)
    setCurrentStep("initial")
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="flex-1 flex flex-col backdrop-blur-md bg-opacity-20 bg-white rounded-lg shadow-lg m-2 sm:m-4 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 p-2 sm:p-4">
          <div className="flex items-center">
            <img
              src="dudeskdarklogo.svg"
              alt="Du Desk Logo"
              className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3"
            />
            <div className="text-white text-sm sm:text-lg font-semibold">DU AI Assist</div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              onClick={handleResetChat}
              variant="ghost"
              className="text-white hover:bg-blue-600 rounded-full px-2 py-1 sm:px-3 sm:py-2 flex items-center space-x-1 sm:space-x-2"
              disabled={isChatEnded}
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Reset</span>
            </Button>
            <Button
              onClick={handleEndChat}
              variant="ghost"
              className="text-white hover:bg-blue-600 rounded-full px-2 py-1 sm:px-3 sm:py-2 flex items-center space-x-1 sm:space-x-2"
              disabled={isChatEnded}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">End ({elapsedTime})</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto p-2 sm:p-4">
          {messages.map((m, index) => {
            let content = m.content
            if (m.role === "assistant" && isFirstMessage && index === 0) {
              content = "Hello. " + content
              setIsFirstMessage(false)
            }
            return (
              <div key={m.id} className={`mb-2 sm:mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start">
                  {m.role === "user" ? (
                    <>
                      <div className="max-w-[80%] p-2 sm:p-3 rounded-xl shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: sanitizeResponse(content),
                          }}
                        />
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full ml-2 sm:ml-3 bg-gray-200 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 bg-blue-500 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                      </div>
                      <div className="max-w-[40%] p-2 sm:p-3 rounded-xl shadow-md bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: sanitizeResponse(content),
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className="mb-2 sm:mb-4 flex justify-start">
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 bg-blue-500 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
                <div className="max-w-[40%] p-2 sm:p-3 rounded-xl bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showOptions && !hasUserSentFirstMessage && (
            <div className="mb-2 sm:mb-4 text-left w-[90%] sm:w-[70%] md:w-[50%] lg:w-[40%]">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Choose an option:</h3>
              <div className="space-y-1 sm:space-y-2">
                <Button
                  onClick={() => handleOptionClick("Check Eligibility")}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  Check Eligibility: Find out if you qualify for your dream course.
                </Button>
                <Button
                  onClick={() => handleOptionClick("Explore Colleges")}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  Explore Colleges: Discover which colleges offer your dream course.
                </Button>
              </div>
            </div>
          )}

          {currentStep === "eligibility_board" && (
            <div className="mb-2 sm:mb-4 text-left w-[90%] sm:w-[70%] md:w-[50%] lg:w-[40%]">
              <div className="space-y-1 sm:space-y-2">
                <Button
                  onClick={() => handleBoardSelection("CBSE")}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  CBSE
                </Button>
                <Button
                  onClick={() => handleBoardSelection("ICSE")}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  ICSE
                </Button>
                <Button
                  onClick={() => handleBoardSelection("State Board")}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  State Board
                </Button>
              </div>
            </div>
          )}

          {currentStep === "eligibility_subjects" && (
            <div className="mb-2 sm:mb-4 text-left w-[90%] sm:w-[70%] md:w-[50%] lg:w-[40%]">
              <div className="space-y-1 sm:space-y-2">
                <Button
                  onClick={() => {
                    setCurrentStep("eligibility_courses")
                    setMessages([
                      ...messages,
                      { id: Date.now().toString(), role: "user", content: "5" },
                      {
                        id: Date.now().toString() + "-response",
                        role: "assistant",
                        content: "Please enter the subjects you studied in Class 12.",
                      },
                    ])
                  }}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  5
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep("eligibility_courses")
                    setMessages([
                      ...messages,
                      { id: Date.now().toString(), role: "user", content: "6" },
                      {
                        id: Date.now().toString() + "-response",
                        role: "assistant",
                        content: "Please enter the subjects you studied in Class 12.",
                      },
                    ])
                  }}
                  variant="outline"
                  className="w-full text-left bg-white bg-opacity-90 backdrop-blur-md text-gray-800 border border-blue-100 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm whitespace-normal"
                >
                  6
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {hasUserSentFirstMessage && !isLoading && (
            <div className="mb-2 sm:mb-4 text-center text-gray-400 text-xs sm:text-sm">
              Thank you! Let me know if you have any other queries regarding CUET (UG) or if I made a mistake.{" "}
              <a
                href="https://dudesk.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 break-words"
              >
                Join our Community for customer support.
              </a>
              <br />
              <span className="text-gray-600">
                Feel free to ask any other questions or interact with our AI Assistant!
              </span>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center p-2 sm:p-4 bg-white bg-opacity-90 backdrop-blur-md shadow-md">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isChatEnded ? "Chat has ended" : "Type a message..."}
            className="flex-grow rounded-lg border border-blue-200 px-2 py-1 sm:px-3 sm:py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 bg-white text-base" // Ensure font size is 16px
            disabled={isChatEnded}
          />
          <Button
            type="submit"
            onClick={handleSubmit}
            className="ml-8 sm:ml-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-1 sm:p-2 shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={isLoading || isChatEnded || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
            <Send className="h-6 w-6 sm:h-7 sm:w-7" />
            )}
          </Button>
        </div>

        <div className="text-xs sm:text-sm text-center text-gray-400 p-2 sm:p-3 bg-white bg-opacity-90 backdrop-blur-md">
          DU Desk AI is new and may make mistakes. For accurate and verified information, visit our{" "}
          <a
            href="https://dudesk.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 break-words"
          >
            website
          </a>
          .
        </div>
      </div>
    </div>
  )
}