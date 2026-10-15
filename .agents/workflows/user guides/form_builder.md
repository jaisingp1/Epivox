# Form Builder User Guide

## 1. Overview
The **Dynamic Form Builder** is a powerful, visual, and intuitive module designed to create, configure, and manage dynamic forms without writing code. It features a drag-and-drop-like interface, real-time rendering, and a robust logic engine, all built within the Epiroc Design System standards.

## 2. Key Features

### 2.1. Visual Canvas & Real-Time Preview
The tool is divided into two main panels:
- **Design Tab**: A structured visual canvas where administrators can define sections, add fields, and configure properties.
- **Form Preview**: A live, 1:1 representation of the final form as the end-user will see it. Any change made in the Design tab is instantly reflected here.

### 2.2. Grid Layout Engine
Forms are not restricted to endless vertical scrolls. Administrators can define the number of columns (up to 4) for any given Section. Individual fields within that section can then be configured to span multiple columns (using the `colSpan` property), allowing for compact and highly organized layouts.

### 2.3. Graphical Options Manager
When working with fields that require predefined choices (like Dropdowns or Likert scales), the builder provides a graphical options editor. Instead of typing comma-separated strings, administrators can visually add, rename, and remove individual options using a dedicated UI.

### 2.4. Safe Actions & Custom Modals
Native browser alerts and prompts have been entirely replaced with custom, brand-compliant Epiroc Modals. Deleting a form or a section triggers a frosted-glass confirmation dialogue, preventing accidental data loss while maintaining a professional appearance.

## 3. Supported Field Types

The builder supports a wide array of data inputs, each with type-specific configuration properties:

- **Short Text (`TextInput`)**: Standard single-line input.
- **Long Text (`TextArea`)**: Multi-line input for descriptions.
- **Rich Text (`RichText`)**: A fully-featured WYSIWYG editor (powered by TipTap) for formatted text, bullet points, and styling.
- **Number (`NumberInput`)**: Numeric input with specific properties for **Min**, **Max**, and **Default Value**.
- **Date (`DatePicker`)**: Standardized date selection.
- **Dropdown (`Select`)**: Single-choice selection from a list of predefined options.
- **Likert Scale (`Likert`)**: A horizontal array of radio buttons ideal for surveys and feedback forms.
- **Rating (`Rating`)**: A visual 5-star interactive rating component.
- **Switch (`Switch`)**: A boolean Yes/No toggle.
- **Attachment (`Attachment`)**: File upload field. It includes specific properties to define the **Storage Folder URI** (for routing to S3, Azure, or Databricks Volumes) and **Allowed Formats** (e.g., `.pdf, .jpg`).

## 4. Advanced Logic Engine

The **Logic Rules** tab allows administrators to create dynamic, smart forms that react to user input.

### 4.1. Targets
Rules can be applied at two levels:
- **Field Level**: Affects an individual input.
- **Section Level**: Affects an entire block of fields simultaneously.

### 4.2. Actions
When a condition is met, the logic engine can trigger the following actions on the target:
- **Show**: Unhides the target.
- **Make Required**: Forces the user to fill out the target before submission.
- **Show & Make Required**: Unhides the target and simultaneously enforces validation.

### 4.3. Validation
The builder includes intelligent validation to prevent conflicting rules. It actively monitors for duplicate logic statements and displays visual warnings if multiple rules attempt to enforce identical behaviors on the same target, ensuring the form logic remains predictable and stable.

## 5. Architecture Notes
- The builder manipulates a JSON Schema (`FormSchema`), which stores the sections, fields, properties, and logic rules.
- Databricks/Storage Strategy: Attachments are not stored as blobs in the relational database. The builder configures a `storage_folder`, instructing the backend to upload the physical file to an external volume and save only the URI string in the database.
