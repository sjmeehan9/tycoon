import XCTest

final class LaunchUITests: XCTestCase {
    func testAppLaunchesAndShowsGreeting() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["bootstrap.greeting"].waitForExistence(timeout: 5))
    }
}
