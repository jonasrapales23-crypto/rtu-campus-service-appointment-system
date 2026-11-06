
import {
  bauBooks,
  bauUniformSizes,
  bauSchoolUniformItems,
  bauPeUniformItems,
} from "../../data/bauCatalog.js";
import "../../styles/BAUDetails.css";

export const EMPTY_BAU_DETAILS = {
  bookCode: "",
  gender: "",
  schoolSelections: {},
  peSelections: {},
};

export default function BAUDetails({ service, value, onChange }) {
  const details = value ?? EMPTY_BAU_DETAILS;

  const selectedBook = bauBooks.find(
    (book) => book.code === details.bookCode
  );

  function update(patch) {
    onChange({ ...details, ...patch });
  }

  function selectGender(gender) {
    update({
      gender,
      schoolSelections: {},
      peSelections: {},
    });
  }

  function selectSize(section, item, size) {
    const key =
      section === "school" ? "schoolSelections" : "peSelections";

    update({
      [key]: {
        ...details[key],
        [item]: details[key]?.[item] === size ? "" : size,
      },
    });
  }

  if (service === "Books") {
    return (
      <section className="bau-details-section">
        <h2>2 · Select your book</h2>
        <p>Choose the book you want to purchase.</p>

        <label className="bau-details-field">
          <span>Select a Book *</span>
          <select
            value={details.bookCode}
            onChange={(event) =>
              update({ bookCode: event.target.value })
            }
          >
            <option value="">-- Choose a book --</option>
            {bauBooks.map((book) => (
              <option key={book.code} value={book.code}>
                {book.title}
              </option>
            ))}
          </select>
        </label>

        {selectedBook && (
          <div className="bau-book-details">
            <span>SELECTED BOOK</span>
            <h3>{selectedBook.title}</h3>
            <p>
              Book Code: <strong>{selectedBook.code}</strong>
            </p>
            <p>
              Price:{" "}
              <strong>
                ₱{selectedBook.price.toFixed(2)}
              </strong>
            </p>
          </div>
        )}
      </section>
    );
  }

  if (service === "Uniforms") {
    return (
      <section className="bau-details-section">
        <h2>2 · Select your uniform sizes</h2>
        <p>
          Choose your gender and select a size for every school
          and PE uniform item.
        </p>

        <div className="bau-details-field">
          <span>Gender *</span>
          <div className="bau-gender-options">
            {["Male", "Female"].map((gender) => (
              <button
                key={gender}
                type="button"
                className={`bau-gender-button ${
                  details.gender === gender ? "active" : ""
                }`}
                aria-pressed={details.gender === gender}
                onClick={() => selectGender(gender)}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {details.gender && (
          <div className="bau-uniform-grid">
            <div className="bau-uniform-panel">
              <h3>School Uniform</h3>
              <p>
                {details.gender === "Male"
                  ? "Choose your Polo and Pants sizes."
                  : "Choose your Blouse, Pants, and Skirt sizes."}
              </p>

              {bauSchoolUniformItems[details.gender].map((item) => (
                <div className="bau-size-row" key={item}>
                  <strong>{item}</strong>
                  <div className="bau-size-options">
                    {bauUniformSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={
                          details.schoolSelections?.[item] === size
                            ? "active"
                            : ""
                        }
                        aria-pressed={
                          details.schoolSelections?.[item] === size
                        }
                        onClick={() =>
                          selectSize("school", item, size)
                        }
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bau-uniform-panel">
              <h3>PE Uniform</h3>
              <p>Choose your PE T-Shirt and Pants sizes.</p>

              {bauPeUniformItems.map((item) => (
                <div className="bau-size-row" key={item}>
                  <strong>{item}</strong>
                  <div className="bau-size-options">
                    {bauUniformSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={
                          details.peSelections?.[item] === size
                            ? "active"
                            : ""
                        }
                        aria-pressed={
                          details.peSelections?.[item] === size
                        }
                        onClick={() =>
                          selectSize("pe", item, size)
                        }
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  return null;
}
