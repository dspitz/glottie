'use client'

import React from 'react'

export function GlassDistortionFilter() {
  return (
    <svg style={{ display: 'none' }}>
      <filter
        id="glass-distortion"
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.02 0.015"
          numOctaves="2"
          seed="2"
          result="turbulence"
        >
          <animate
            attributeName="baseFrequency"
            values="0.02 0.015;0.025 0.018;0.02 0.015"
            dur="20s"
            repeatCount="indefinite"
          />
        </feTurbulence>

        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>

        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />

        <feSpecularLighting
          in="softMap"
          surfaceScale="5"
          specularConstant="1"
          specularExponent="100"
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>

        <feComposite
          in="specLight"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="litImage"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="8"
          xChannelSelector="R"
          yChannelSelector="G"
        >
          <animate
            attributeName="scale"
            values="8;12;8"
            dur="15s"
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>
    </svg>
  )
}