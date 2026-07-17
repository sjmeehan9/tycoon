import XCTest
@testable import __PROJECT_NAME__

final class BootstrapTests: XCTestCase {
    func testGreetingIsStable() {
        XCTAssertEqual(Bootstrap.greeting(), "Ready.")
    }
}
