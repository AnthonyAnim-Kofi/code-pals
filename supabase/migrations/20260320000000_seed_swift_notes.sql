-- Migration to seed Swift language, unit, and notes dynamically
DO $$
DECLARE
    v_language_id uuid;
    v_unit_id uuid;
BEGIN
    -- 1. Get or create Swift language
    SELECT id INTO v_language_id FROM public.languages WHERE slug = 'swift';
    
    IF v_language_id IS NULL THEN
        INSERT INTO public.languages (name, slug, icon, description, is_active)
        VALUES ('Swift', 'swift', '📱', 'Learn iOS development', true)
        RETURNING id INTO v_language_id;
    END IF;

    -- 2. Get or create Swift Unit 1
    SELECT id INTO v_unit_id FROM public.units 
    WHERE language_id = v_language_id ORDER BY order_index ASC LIMIT 1;

    IF v_unit_id IS NULL THEN
        INSERT INTO public.units (language_id, title, description, color, order_index, is_active)
        VALUES (v_language_id, 'Unit 1: Swift Basics', 'Introduction to Swift programming', 'orange', 0, true)
        RETURNING id INTO v_unit_id;
    END IF;

    -- 3. Delete existing notes for this unit to prevent duplicates if migration is re-run
    DELETE FROM public.unit_notes WHERE unit_id = v_unit_id;

    -- 4. Insert notes
    INSERT INTO public.unit_notes (unit_id, title, content, order_index)
    VALUES
    (v_unit_id, 'Chapter 1: Introduction to Swift', 'Swift is a powerful, intuitive programming language developed by Apple for iOS, macOS, watchOS, and tvOS. It is designed to be safe, fast, and expressive.

## 1.1 Hello World
In Swift, a complete program can be as short as one line. You don''t need to import separate libraries for basic functionality like input/output.

print("Hello, World!")

## 1.2 Comments
Comments are ignored by the compiler and are used to explain code.

// This is a single-line comment

/* 
This is a 
multi-line comment 
*/', 0),
    (v_unit_id, 'Chapter 2: Variables, Constants, and Data Types', 'Swift is a type-safe language, meaning it encourages you to be clear about the types of values your code can work with.

## 2.1 Variables and Constants
Use let to make a constant (a value that cannot change) and var to make a variable (a value that can change).

var myVariable = 42
myVariable = 50 // Allowed

let myConstant = 42
// myConstant = 50 // Error: Cannot assign to value: ''myConstant'' is a ''let'' constant

## 2.2 Explicit Data Types
Swift usually infers the type of a variable based on its initial value (Type Inference). However, you can also explicitly declare the type.

let implicitInteger = 70
let implicitDouble = 70.0
let explicitDouble: Double = 70
let isLearningSwift: Bool = true
let greeting: String = "Welcome"', 1),
    (v_unit_id, 'Chapter 3: Basic Operators', 'Operators are special symbols or phrases that you use to check, change, or combine values.

## 3.1 Arithmetic and Assignment
Swift supports standard arithmetic operators and combines assignment with operation.

var score = 10
score += 5 // score is now 15
let total = score * 2 // total is 30
let remainder = 10 % 3 // remainder is 1

## 3.2 Comparison and Logical Operators
Used primarily in control flow to evaluate conditions.

let isEqual = (1 == 1) // true
let isNotEqual = (2 != 1) // true
let isGreater = (5 > 3) // true

let hasKey = true
let knowsPassword = false
let canEnter = hasKey && knowsPassword // false (AND operator)
let canTry = hasKey || knowsPassword // true (OR operator)', 2),
    (v_unit_id, 'Chapter 4: Strings and Characters', 'Strings in Swift are Unicode-compliant and offer powerful ways to manipulate text.

## 4.1 String Interpolation
You can easily inject variables directly into a string using \().

let apples = 3
let oranges = 5
let fruitSummary = "I have \(apples + oranges) pieces of fruit."
// "I have 8 pieces of fruit."

## 4.2 Multi-line Strings
Use three double quotation marks for strings that span multiple lines.

let quotation = """
Even though there''s whitespace to the left,
the actual lines aren''t indented.
"""', 3),
    (v_unit_id, 'Chapter 5: Control Flow', 'Control flow allows you to dictate the path your code takes based on conditions.

## 5.1 If Statements

let temperature = 25
if temperature > 30 {
    print("It''s hot outside.")
} else if temperature < 10 {
    print("It''s cold outside.")
} else {
    print("The weather is nice.")
}

## 5.2 Switch Statements
Switch statements in Swift are very powerful, must be exhaustive, and do not fall through by default (no break statement needed).

let vegetable = "red pepper"
switch vegetable {
case "celery":
    print("Add some raisins.")
case "cucumber", "watercress":
    print("That would make a good tea sandwich.")
case let x where x.hasSuffix("pepper"):
    print("Is it a spicy \(x)?") // This will execute
default:
    print("Everything tastes good in soup.")
}

## 5.3 Loops (For-In and While)

// For-In Loop
for index in 1...5 {
    print("This is loop number \(index)")
}

// While Loop
var n = 2
while n < 100 {
    n *= 2
}', 4),
    (v_unit_id, 'Chapter 6: Collections (Arrays, Sets, Dictionaries)', 'Collections are used to store multiple values in a single variable.

## 6.1 Arrays
Ordered collections of values.

var shoppingList: [String] = ["Eggs", "Milk"]
shoppingList.append("Flour")
let firstItem = shoppingList[0] // "Eggs"

## 6.2 Dictionaries
Unordered collections of key-value pairs.

var occupations = [
    "Malcolm": "Captain",
    "Kaylee": "Mechanic"
]
occupations["Jayne"] = "Public Relations"

## 6.3 Sets
Unordered collections of unique values.

var favoriteGenres: Set<String> = ["Rock", "Classical", "Hip hop"]
favoriteGenres.insert("Jazz")', 5),
    (v_unit_id, 'Chapter 7: Functions and Closures', 'Functions are self-contained chunks of code that perform a specific task. Closures are like unnamed functions you can pass around.

## 7.1 Defining and Calling Functions
Functions use the func keyword. You can define parameter names and return types ->.

func greet(person: String, day: String) -> String {
    return "Hello \(person), today is \(day)."
}
print(greet(person: "Bob", day: "Tuesday"))

## 7.2 Argument Labels
You can provide a label for the caller to use, and a separate name for use inside the function. Use _ to omit a label.

func greet(_ person: String, on day: String) -> String {
    return "Hello \(person), today is \(day)."
}
print(greet("John", on: "Wednesday"))

## 7.3 Closures
Closures are blocks of code that can be passed as variables.

let numbers = [1, 5, 3, 12, 2]
// Sorting using a closure
let sortedNumbers = numbers.sorted { (a, b) -> Bool in
    return a < b
}
// Shorthand syntax
let quickSorted = numbers.sorted { $0 < $1 }', 6),
    (v_unit_id, 'Chapter 8: Optionals and Error Handling', 'Swift uses Optionals to handle the absence of a value safely.

## 8.1 Optionals
An optional either contains a value or contains nil (no value).

var optionalString: String? = "Hello"
print(optionalString == nil) // false
optionalString = nil // Now it contains no value

## 8.2 Unwrapping Optionals (If Let / Guard Let)
You must unwrap an optional to use its value safely.

var optionalName: String? = "John Appleseed"

// Using if let
if let name = optionalName {
    print("Hello, \(name)") // Executes if optionalName is not nil
}

// Using guard let (early exit)
func greetUser(name: String?) {
    guard let unwrappedName = name else {
        print("No name provided")
        return
    }
    print("Welcome, \(unwrappedName)")
}

## 8.3 Error Handling
Use throw, try, do, and catch to handle errors.

enum PrinterError: Error {
    case outOfPaper
    case noToner
}

func sendToPrinter(jobs: Int) throws -> String {
    if jobs > 5 { throw PrinterError.outOfPaper }
    return "Job sent"
}

do {
    let response = try sendToPrinter(jobs: 6)
    print(response)
} catch PrinterError.outOfPaper {
    print("Please add paper.")
} catch {
    print(error)
}', 7),
    (v_unit_id, 'Chapter 9: Enumerations (Enums)', 'Enums define a common type for a group of related values.

## 9.1 Basic Enums

enum CompassPoint {
    case north, south, east, west
}
var direction = CompassPoint.north

## 9.2 Associated Values
Enums can store additional information alongside their cases.

enum Barcode {
    case upc(Int, Int, Int, Int)
    case qrCode(String)
}

var productBarcode = Barcode.upc(8, 85909, 51226, 3)', 8),
    (v_unit_id, 'Chapter 10: Structures and Classes', 'Structs and classes are the building blocks of flexible, custom data types.

## 10.1 Structs (Value Types)
Structs are copied when they are passed around in your code.

struct Resolution {
    var width = 0
    var height = 0
}
var hd = Resolution(width: 1920, height: 1080)
var cinema = hd
cinema.width = 2048 // hd.width is still 1920. They are separate copies.

## 10.2 Classes (Reference Types)
Classes are passed by reference. Multiple variables can point to the same class instance.

class VideoMode {
    var resolution = Resolution()
    var interlaced = false
    var frameRate = 0.0
}
let tenEighty = VideoMode()
let alsoTenEighty = tenEighty
alsoTenEighty.frameRate = 30.0 // tenEighty.frameRate is also 30.0', 9),
    (v_unit_id, 'Chapter 11: Properties and Methods', 'Properties associate values with a particular class, structure, or enumeration. Methods are functions associated with a type.

## 11.1 Computed Properties
Properties that don''t store a value directly but provide a getter and a setter to calculate values dynamically.

struct Square {
    var sideLength: Double
    var area: Double {
        get {
            return sideLength * sideLength
        }
        set {
            sideLength = newValue.squareRoot()
        }
    }
}

## 11.2 Methods

class Counter {
    var count = 0
    func increment() {
        count += 1
    }
}', 10),
    (v_unit_id, 'Chapter 12: Initialization', 'Initialization is the process of preparing an instance of a class, structure, or enum for use.

## 12.1 Init Methods
Classes and structs must have all their properties set to an initial value by the time initialization completes.

struct Fahrenheit {
    var temperature: Double
    init() {
        temperature = 32.0
    }
}
var f = Fahrenheit()

## 12.2 Custom Initializers

struct Celsius {
    var temperatureInCelsius: Double
    init(fromFahrenheit fahrenheit: Double) {
        temperatureInCelsius = (fahrenheit - 32.0) / 1.8
    }
}
let boilingPointOfWater = Celsius(fromFahrenheit: 212.0)', 11),
    (v_unit_id, 'Chapter 13: Protocols and Extensions', 'Protocols define a blueprint of methods, properties, and other requirements. Extensions add new functionality to an existing class, structure, enum, or protocol.

## 13.1 Protocols

protocol FullyNamed {
    var fullName: String { get }
}

struct Person: FullyNamed {
    var fullName: String
}
let john = Person(fullName: "John Doe")

## 13.2 Extensions

extension Double {
    var km: Double { return self * 1_000.0 }
    var m: Double { return self }
}
let distance = 25.4.km // 25400.0', 12),
    (v_unit_id, 'Chapter 14: Generics', 'Generics enable you to write flexible, reusable functions and types that can work with any type.

## 14.1 Generic Functions
The placeholder <T> tells Swift that T is a generic placeholder type name.

func swapTwoValues<T>(_ a: inout T, _ b: inout T) {
    let temporaryA = a
    a = b
    b = temporaryA
}

var firstInt = 3
var secondInt = 107
swapTwoValues(&firstInt, &secondInt) // Works with Ints

var firstString = "hello"
var secondString = "world"
swapTwoValues(&firstString, &secondString) // Works with Strings', 13),
    (v_unit_id, 'Chapter 15: Memory Management (ARC)', 'Swift uses Automatic Reference Counting (ARC) to track and manage your app''s memory usage. In most cases, memory management "just works," but you need to be aware of retain cycles.

## 15.1 Strong Reference Cycles
If two class instances hold a "strong" reference to each other, ARC can never free them.

class Person {
    var apartment: Apartment?
    // deinit is called when the object is destroyed
    deinit { print("Person deallocated") } 
}

class Apartment {
    var tenant: Person?
    deinit { print("Apartment deallocated") }
}

## 15.2 Weak and Unowned References
To resolve strong reference cycles, use weak or unowned before a property declaration. Weak references do not keep a strong hold on the instance they refer to and must be optional variables.

class SafeApartment {
    weak var tenant: Person? // Weak prevents the retain cycle
}', 14);
END $$;
