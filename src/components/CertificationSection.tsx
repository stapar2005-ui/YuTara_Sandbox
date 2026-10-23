"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { CERTIFICATIONS } from "@/lib/certifications";

export function CertificationSection() {
  const [active, setActive] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const move = (direction: number) =>
    setActive(
      (current) =>
        (current + direction + CERTIFICATIONS.length) % CERTIFICATIONS.length,
    );

  const activeCertificate = CERTIFICATIONS[active];
  const visible = [-1, 0, 1].map(
    (offset) =>
      CERTIFICATIONS[
        (active + offset + CERTIFICATIONS.length) % CERTIFICATIONS.length
      ],
  );

  return (
    <section className="section certification-section" id="about">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">About YuTara</div>
            <h2 className="display">Trust, made tangible.</h2>
          </div>
          <p>
            YuTara is starting in Panabo City with a verification process that
            helps buyers ask better questions, backed by a clear record of the
            documents and checks behind each listing.
          </p>
        </div>
        <div
          className="cert-carousel"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") move(-1);
            if (event.key === "ArrowRight") move(1);
          }}
          onPointerDown={(event) => setDragStart(event.clientX)}
          onPointerUp={(event) => {
            if (dragStart === null) return;
            const delta = event.clientX - dragStart;
            if (Math.abs(delta) > 35) move(delta < 0 ? 1 : -1);
            setDragStart(null);
          }}
        >
          <button
            className="carousel-control previous"
            aria-label="Previous certificate"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="cert-track">
            {visible.map((certificate, index) => {
              const position = index - 1;
              return (
                <article
                  key={`${certificate.id}-${active}`}
                  className={`cert-card ${position === 0 ? "center" : position < 0 ? "left" : "right"}`}
                >
                  <div
                    className="cert-paper"
                    style={{
                      background: `linear-gradient(135deg, ${certificate.accent}, #f8f5ed 72%)`,
                    }}
                  >
                    <ShieldCheck size={30} />
                    <span>YuTara trust library</span>
                    <strong>{certificate.title}</strong>
                    <small>{certificate.issuer}</small>
                    <div className="cert-lines" />
                  </div>
                  {position === 0 && (
                    <div className="cert-info">
                      <h3>{activeCertificate.title}</h3>
                      <p>{activeCertificate.description}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <button
            className="carousel-control next"
            aria-label="Next certificate"
            onClick={() => move(1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="carousel-caption">
          <span>
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(CERTIFICATIONS.length).padStart(2, "0")}
          </span>
          <strong>{activeCertificate.title}</strong>
          <span>Part of the YuTara trust library.</span>
        </div>
      </div>
    </section>
  );
}
